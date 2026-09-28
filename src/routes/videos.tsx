import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { mostViewed, newest } from "@/lib/catalog";
import { VideoGrid } from "@/components/video-card";

export const Route = createFileRoute("/videos")({
  validateSearch: z.object({ ordem: z.enum(["vistos", "recentes"]).optional() }),
  head: () => ({ meta: [
    { title: "Todos os vídeos — Hotflix" },
    { name: "description", content: "Veja os vídeos mais vistos e mais recentes da Hotflix." },
    { property: "og:title", content: "Todos os vídeos — Hotflix" },
    { property: "og:description", content: "Os vídeos mais vistos e mais recentes." },
  ] }),
  component: VideosPage,
});

function VideosPage() {
  const { ordem } = Route.useSearch();
  const recent = ordem === "recentes";
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">{recent ? "Novos vídeos" : "Mais vistos"}</h1>
      <VideoGrid items={recent ? newest() : mostViewed()} />
    </div>
  );
}
