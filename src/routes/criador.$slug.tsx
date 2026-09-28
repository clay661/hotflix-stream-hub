import { createFileRoute, notFound } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { catalogQuery, useCatalog, fmtViews } from "@/lib/catalog";
import { Section, VideoGrid } from "@/components/video-card";

export const Route = createFileRoute("/criador/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(catalogQuery);
    const creator = data.creators.find((c) => c.slug === params.slug);
    if (!creator) throw notFound();
    return { creator };
  },
  head: ({ loaderData }) => loaderData ? {
    meta: [
      { title: `${loaderData.creator.name} — Criador na Hotflix` },
      { name: "description", content: loaderData.creator.bio },
      { property: "og:title", content: `${loaderData.creator.name} na Hotflix` },
      { property: "og:description", content: loaderData.creator.bio },
    ],
  } : { meta: [{ title: "Criador não encontrado" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <p className="p-10 text-center">Criador não encontrado.</p>,
  errorComponent: () => <p className="p-10 text-center">Erro ao carregar.</p>,
  component: CreatorPage,
});

function CreatorPage() {
  const { creator: c } = Route.useLoaderData();
  const [following, setFollowing] = useState(false);
  const { byCreator } = useCatalog();
  const vids = byCreator(c.slug);
  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 pt-10 text-center sm:flex-row sm:text-left">
        <img src={c.avatar} alt={c.name} className="h-28 w-28 shrink-0 rounded-full ring-4 ring-primary/50" />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold sm:justify-start">{c.name}{c.verified && <BadgeCheck className="h-6 w-6 text-primary" />}</h1>
          <p className="mt-2 text-muted-foreground">{c.bio}</p>
          <p className="mt-2 text-sm">{vids.length} vídeos · {fmtViews(vids.reduce((a, v) => a + v.views, 0))} visualizações</p>
        </div>
        <button onClick={() => setFollowing(!following)} className={`rounded-full px-6 py-2.5 font-semibold ${following ? "bg-secondary" : "bg-primary text-primary-foreground"}`}>
          {following ? "Seguindo" : "Seguir"}
        </button>
      </div>
      <Section title="Vídeos do criador"><VideoGrid items={vids} /></Section>
    </>
  );
}
