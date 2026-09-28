import { createFileRoute, Link } from "@tanstack/react-router";
import { catalogQuery, useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/categorias")({
  head: () => ({ meta: [
    { title: "Categorias — Hotflix" },
    { name: "description", content: "Explore todas as categorias de vídeos da Hotflix." },
    { property: "og:title", content: "Categorias — Hotflix" },
    { property: "og:description", content: "Explore todas as categorias de vídeos." },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  errorComponent: () => <p className="p-10 text-center">Não foi possível carregar os vídeos.</p>,
  component: Page,
});

function Page() {
  const { categories, byCat, creators, byCreator } = useCatalog();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">Categorias</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }} className="group relative aspect-[16/9] overflow-hidden rounded-2xl">
            <img src={`https://picsum.photos/seed/cat-${i}/800/450`} alt="" loading="lazy" className="h-full w-full object-cover opacity-50 transition group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h2 className="text-xl font-bold">{c.name}</h2>
              <p className="text-sm text-muted-foreground">{byCat(c.slug).length} vídeos · {c.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
