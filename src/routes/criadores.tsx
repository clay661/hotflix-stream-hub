import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { catalogQuery, useCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/criadores")({
  head: () => ({ meta: [
    { title: "Criadores — Hotflix" },
    { name: "description", content: "Conheça os criadores de conteúdo da Hotflix." },
    { property: "og:title", content: "Criadores — Hotflix" },
    { property: "og:description", content: "Conheça os criadores de conteúdo." },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  errorComponent: () => <p className="p-10 text-center">Não foi possível carregar os vídeos.</p>,
  component: Page,
});

function Page() {
  const { creators, byCreator } = useCatalog();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">Criadores</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c) => (
          <Link key={c.slug} to="/criador/$slug" params={{ slug: c.slug }} className="flex items-center gap-4 rounded-2xl bg-card p-4 hover:bg-accent">
            <img src={c.avatar} alt={c.name} loading="lazy" className="h-16 w-16 shrink-0 rounded-full" />
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-semibold">{c.name}{c.verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>
              <p className="truncate text-sm text-muted-foreground">{c.bio}</p>
              <p className="text-xs text-muted-foreground">{byCreator(c.slug).length} vídeos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
