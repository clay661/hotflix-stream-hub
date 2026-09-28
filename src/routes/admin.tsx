import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, Film, FolderTree, Users, MessageSquare, BarChart3, Settings, LogOut, Menu, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin/entrar" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    if (!isAdmin) throw redirect({ to: "/admin/entrar" });
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Painel administrativo — Hotflix" },
      { name: "description", content: "Gestão de vídeos, usuários, comentários e estatísticas da Hotflix." },
      { property: "og:title", content: "Painel — Hotflix" },
      { property: "og:description", content: "Painel administrativo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/videos", label: "Vídeos", icon: Film },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/comentarios", label: "Comentários", icon: MessageSquare },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const nav = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/admin/entrar", replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/admin" className="font-display text-lg font-extrabold"><span className="text-primary">HOT</span>FLIX <span className="text-xs font-semibold text-muted-foreground">ADMIN</span></Link>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: "exact" in rest }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-primary/15 !text-primary font-semibold" }}
          >
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-border p-3">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"><ExternalLink className="h-4 w-4" />Ver site</Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"><LogOut className="h-4 w-4" />Sair</button>
        <p className="truncate px-3 pt-1 text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-40 bg-background/70 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card transition-transform lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <span className="font-display font-extrabold"><span className="text-primary">HOT</span>FLIX Admin</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
