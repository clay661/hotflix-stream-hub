import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Search } from "lucide-react";
import { videos, creators, categories } from "@/lib/catalog";
import { VideoGrid } from "@/components/video-card";

export const Route = createFileRoute("/busca")({
  validateSearch: z.object({ q: z.string().optional().default("") }),
  head: () => ({ meta: [
    { title: "Buscar — Hotflix" },
    { name: "description", content: "Busque vídeos, criadores e categorias na Hotflix." },
    { property: "og:title", content: "Buscar — Hotflix" },
    { property: "og:description", content: "Busque vídeos, criadores e categorias." },
  ] }),
  component: SearchPage,
});

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function SearchPage() {
  const { q } = Route.useSearch();
  const nav = useNavigate({ from: "/busca" });
  const t = norm(q.trim());
  const vs = t ? videos.filter((v) => norm(v.title + v.tags.join(" ")).includes(t)) : [];
  const cs = t ? creators.filter((c) => norm(c.name).includes(t)) : [];
  const cats = t ? categories.filter((c) => norm(c.name).includes(t)) : [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <label className="flex items-center gap-2 rounded-full bg-secondary px-4 py-3">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input autoFocus value={q} onChange={(e) => nav({ search: { q: e.target.value }, replace: true })} placeholder="O que você quer assistir?" className="w-full min-w-0 bg-transparent outline-none" />
      </label>
      {!t && (
        <div className="mt-6 flex flex-wrap gap-2">
          {["viagens", "treino", "música", "review", "cozinha"].map((s) => (
            <button key={s} onClick={() => nav({ search: { q: s } })} className="rounded-full border border-border px-4 py-1.5 text-sm">{s}</button>
          ))}
        </div>
      )}
      {t && !vs.length && !cs.length && !cats.length && <p className="mt-16 text-center text-muted-foreground">Nenhum resultado para “{q}”.</p>}
      {(cs.length > 0 || cats.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {cats.map((c) => <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }} className="rounded-full bg-primary/15 px-4 py-1.5 text-sm text-primary">{c.name}</Link>)}
          {cs.map((c) => <Link key={c.slug} to="/criador/$slug" params={{ slug: c.slug }} className="rounded-full bg-secondary px-4 py-1.5 text-sm">@{c.name}</Link>)}
        </div>
      )}
      {vs.length > 0 && <div className="mt-6"><VideoGrid items={vs} /></div>}
    </div>
  );
}
