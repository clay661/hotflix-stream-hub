import { createServerFn } from "@tanstack/react-start";
import { publicClient } from "./catalog.server";

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [cats, creators, vids] = await Promise.all([
    sb.from("categories").select("id, slug, name, description, position").order("position"),
    sb.from("creators").select("id, slug, name, bio, verified, avatar").order("name"),
    sb.from("videos")
      .select("id, slug, title, description, duration, thumb, video_url, tags, views, published_at, categories(slug), creators(slug)")
      .eq("published", true)
      .order("published_at", { ascending: false }),
  ]);
  if (cats.error || creators.error || vids.error) {
    console.error(cats.error ?? creators.error ?? vids.error);
    throw new Error("Não foi possível carregar o catálogo.");
  }
  return {
    categories: cats.data,
    creators: creators.data,
    videos: vids.data.map((v) => ({
      id: v.id,
      slug: v.slug,
      title: v.title,
      description: v.description,
      duration: v.duration,
      thumb: v.thumb,
      videoUrl: v.video_url,
      tags: v.tags,
      views: v.views,
      publishedAt: v.published_at,
      category: (v.categories as { slug: string } | null)?.slug ?? "",
      creator: (v.creators as { slug: string } | null)?.slug ?? "",
    })),
  };
});
