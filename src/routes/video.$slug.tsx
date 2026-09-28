import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, Share2, Star, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { catalogQuery, useCatalog, fmtViews, fmtDate } from "@/lib/catalog";
import { Comments } from "@/components/comments";
import { trackVideoView } from "@/lib/tracking";
import { Section, VideoGrid } from "@/components/video-card";

export const Route = createFileRoute("/video/$slug")({
  loader: async ({ params, context }) => {
    const cat = await context.queryClient.ensureQueryData(catalogQuery);
    const video = cat.videos.find((v) => v.slug === params.slug);
    if (!video) throw notFound();
    return { video };
  },
  head: ({ loaderData }) => loaderData ? {
    meta: [
      { title: `${loaderData.video.title} — Hotflix` },
      { name: "description", content: loaderData.video.description },
      { property: "og:title", content: loaderData.video.title },
      { property: "og:description", content: loaderData.video.description },
      { property: "og:type", content: "video.other" },
      { property: "og:image", content: loaderData.video.thumb },
      { name: "twitter:image", content: loaderData.video.thumb },
    ],
  } : { meta: [{ title: "Vídeo não encontrado — Hotflix" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <p className="p-10 text-center">Vídeo não encontrado.</p>,
  errorComponent: () => <p className="p-10 text-center">Não foi possível carregar o vídeo.</p>,
  component: VideoPage,
});

function VideoPage() {
  const { video: v } = Route.useLoaderData();
  const { getCreator, getCat, videos } = useCatalog();
  const c = getCreator(v.creator);
  useEffect(() => trackVideoView(v.id), [v.id]);
  const [liked, setLiked] = useState(false);
  const [fav, setFav] = useState(false);
  const related = videos.filter((x) => x.slug !== v.slug && (x.category === v.category || x.creator === v.creator)).slice(0, 8);
  const btn = "inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-accent";
  return (
    <>
      <div className="mx-auto max-w-5xl px-0 sm:px-4 sm:pt-6">
        <video controls poster={v.thumb.replace("640/360", "1280/720")} className="aspect-video w-full bg-muted sm:rounded-2xl" src={v.videoUrl} />
        <div className="px-4 sm:px-0">
          <nav className="mt-4 text-xs text-muted-foreground">
            <Link to="/">Início</Link> / <Link to="/categoria/$slug" params={{ slug: v.category }} className="text-primary">{getCat(v.category)?.name}</Link>
          </nav>
          <h1 className="mt-2 text-xl font-bold sm:text-2xl">{v.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{fmtViews(v.views)} visualizações · {fmtDate(v.publishedAt)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setLiked(!liked)} className={btn}><Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />Curtir</button>
            <button onClick={() => navigator.share?.({ title: v.title, url: location.href }) ?? navigator.clipboard.writeText(location.href)} className={btn}><Share2 className="h-4 w-4" />Compartilhar</button>
            <button onClick={() => setFav(!fav)} className={btn}><Star className={`h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />Favoritar</button>
          </div>
          {c && <Link to="/criador/$slug" params={{ slug: c.slug }} className="mt-5 flex items-center gap-3 rounded-xl bg-card p-3">
            <img src={c.avatar} alt={c.name} className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-semibold">{c.name}{c.verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>
              <p className="truncate text-xs text-muted-foreground">{c.bio}</p>
            </div>
          </Link>}
          <p className="mt-4 text-sm text-muted-foreground">{v.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">{v.tags.map((t) => <span key={t} className="rounded-full border border-border px-3 py-1 text-xs">#{t}</span>)}</div>
          <Comments videoId={v.id} />
        </div>
      </div>
      <Section title="Vídeos relacionados"><VideoGrid items={related} /></Section>
    </>
  );
}
