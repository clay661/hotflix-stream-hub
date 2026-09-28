import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCatalog } from "./catalog.functions";

export type Catalog = Awaited<ReturnType<typeof getCatalog>>;
export type Video = Catalog["videos"][number];
export type Category = Catalog["categories"][number];
export type Creator = Catalog["creators"][number];

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

export function useCatalog() {
  const { data } = useSuspenseQuery(catalogQuery);
  const getCat = (slug: string) => data.categories.find((c) => c.slug === slug);
  const getCreator = (slug: string) => data.creators.find((c) => c.slug === slug);
  return {
    ...data,
    getCat,
    getCreator,
    getVideo: (slug: string) => data.videos.find((v) => v.slug === slug),
    byCat: (slug: string) => data.videos.filter((v) => v.category === slug),
    byCreator: (slug: string) => data.videos.filter((v) => v.creator === slug),
    mostViewed: () => [...data.videos].sort((a, b) => b.views - a.views),
    newest: () => [...data.videos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  };
}

export const fmtViews = (n: number) =>
  n >= 1000 ? `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(n);
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
