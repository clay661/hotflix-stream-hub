import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { VideoGrid } from "@/components/video-card";

export const Route = createFileRoute("/categoria/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(catalogQuery);
    const cat = data.categories.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return { cat };
  },
  head: ({ loaderData }) => loaderData ? {
    meta: [
      { title: `Vídeos de ${loaderData.cat.name} — Hotflix` },
      { name: "description", content: loaderData.cat.description },
      { property: "og:title", content: `${loaderData.cat.name} na Hotflix` },
      { property: "og:description", content: loaderData.cat.description },
    ],
  } : { meta: [{ title: "Categoria não encontrada" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <p className="p-10 text-center">Categoria não encontrada.</p>,
  errorComponent: () => <p className="p-10 text-center">Erro ao carregar.</p>,
  component: CatPage,
});

function CatPage() {
  const { cat } = Route.useLoaderData();
  const { byCat } = useCatalog();
  const [sort, setSort] = useState("relevantes");
  const items = [...byCat(cat.slug)].sort((a, b) =>
    sort === "vistos" ? b.views - a.views : sort === "recentes" ? b.publishedAt.localeCompare(a.publishedAt) : 0);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{cat.name}</h1>
      <p className="mt-2 text-muted-foreground">{cat.description}</p>
      <div className="my-6 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{items.length} vídeos</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full bg-secondary px-4 py-2 text-sm">
          <option value="relevantes">Mais relevantes</option>
          <option value="vistos">Mais vistos</option>
          <option value="recentes">Mais recentes</option>
        </select>
      </div>
      <VideoGrid items={items} />
    </div>
  );
}
