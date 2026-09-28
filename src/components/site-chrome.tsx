import { Link, useNavigate } from "@tanstack/react-router";
import { Home, LayoutGrid, Flame, Search, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function Logo() {
  return (
    <Link to="/" className="font-display text-xl font-extrabold tracking-tight shrink-0">
      <span className="text-primary">HOT</span>FLIX
    </Link>
  );
}

const links = [
  { to: "/", label: "Início" },
  { to: "/categorias", label: "Categorias" },
  { to: "/videos", label: "Mais vistos" },
  { to: "/videos", label: "Novos", search: { ordem: "recentes" } },
  { to: "/criadores", label: "Criadores" },
] as const;

export function SiteHeader() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden gap-5 text-sm text-muted-foreground lg:flex">
          {links.map((l) => (
            <Link key={l.label} to={l.to} search={("search" in l ? l.search : {}) as never} className="hover:text-foreground" activeOptions={{ exact: true, includeSearch: true }} activeProps={{ className: "text-foreground font-semibold" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <form
          className="ml-auto hidden min-w-0 flex-1 sm:flex md:max-w-sm"
          onSubmit={(e) => { e.preventDefault(); nav({ to: "/busca", search: { q } }); }}
        >
          <label className="flex w-full items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar vídeos, criadores..." className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground" />
          </label>
        </form>
        <Link to="/busca" search={{ q: "" }} className="ml-auto sm:hidden" aria-label="Buscar"><Search className="h-5 w-5" /></Link>
        <AccountButton />
      </div>
    </header>
  );
}

export function BottomNav() {
  const items = [
    { to: "/", icon: Home, label: "Início" },
    { to: "/categorias", icon: LayoutGrid, label: "Categorias" },
    { to: "/videos", icon: Flame, label: "Em alta" },
    { to: "/criadores", icon: Users, label: "Criadores" },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur md:hidden">
      {items.map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to} activeOptions={{ exact: true }} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
          <Icon className="h-5 w-5" />{label}
        </Link>
      ))}
    </nav>
  );
}

function AccountButton() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <span className="h-8 w-16 shrink-0" />;
  if (!user)
    return (
      <Link to="/auth" className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
        Entrar
      </Link>
    );
  return (
    <div className="flex shrink-0 items-center gap-2">
      {isAdmin && (
        <Link to="/admin" className="hidden rounded-full border border-border px-3 py-1.5 text-sm sm:inline-block">
          Painel
        </Link>
      )}
      <Link to="/conta" aria-label="Minha conta" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {(user.email ?? "?")[0]!.toUpperCase()}
      </Link>
    </div>
  );
}
