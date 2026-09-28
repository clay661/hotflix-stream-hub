import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { categories, creators, mostViewed, newest, videos, getCat, fmtViews } from "@/lib/catalog";
import { Section, VideoGrid } from "@/components/video-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hotflix — Assista vídeos em alta, novos e mais vistos" },
      { name: "description", content: "Descubra vídeos de viagens, esportes, música, tecnologia e estilo de vida na Hotflix." },
      { property: "og:title", content: "Hotflix — Assista vídeos em alta" },
      { property: "og:description", content: "Vídeos de viagens, esportes, música, tecnologia e mais." },
    ],
  }),
  component: Home,
});

function Home() {
  const f = videos[0];
  const more = <Link to="/videos" className="text-sm text-primary">Ver todos</Link>;
  return (
    <>
      <section className="relative">
        <div className="relative h-[62vh] min-h-[380px] max-h-[620px] overflow-hidden">
          <img src={f.thumb.replace("640/360", "1600/900")} alt={f.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8">
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">Destaque · {getCat(f.category)?.name}</span>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">{f.title}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{f.description}</p>
          <Link to="/video/$slug" params={{ slug: f.slug }} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105">
            <Play className="h-4 w-4 fill-current" /> Assistir agora
          </Link>
        </div>
      </section>
      <Section title="Em alta" action={more}><VideoGrid items={videos.slice(1, 9)} /></Section>
      <Section title="Mais vistos" action={more}><VideoGrid items={mostViewed().slice(0, 4)} /></Section>
      <Section title="Novos vídeos" action={more}><VideoGrid items={newest().slice(0, 4)} /></Section>
      <Section title="Categorias populares">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => (
            <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <img src={`https://picsum.photos/seed/cat-${i}/400/300`} alt="" loading="lazy" className="h-full w-full object-cover opacity-60" />
              <span className="absolute inset-0 grid place-items-center font-display font-bold">{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>
      <Section title="Criadores em destaque">
        <div className="flex gap-5 overflow-x-auto pb-2">
          {creators.map((c) => (
            <Link key={c.slug} to="/criador/$slug" params={{ slug: c.slug }} className="w-24 shrink-0 text-center">
              <img src={c.avatar} alt={c.name} loading="lazy" className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-primary/60" />
              <p className="mt-2 truncate text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">{fmtViews(videos.filter((v) => v.creator === c.slug).reduce((a, v) => a + v.views, 0))}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
