import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { inputCls } from "@/lib/ui-classes";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Hotflix" },
      { name: "description", content: "Gerencie seu perfil e seus comentários na Hotflix." },
      { property: "og:title", content: "Minha conta — Hotflix" },
      { property: "og:description", content: "Gerencie seu perfil." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).single()).data,
  });
  const comments = useQuery({
    queryKey: ["my-comments", user.id],
    queryFn: async () =>
      (await supabase.from("comments").select("id, body, created_at, status, videos(title, slug)").eq("user_id", user.id).neq("status", "deleted").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });
  const [name, setName] = useState("");
  useEffect(() => setName(profile.data?.display_name ?? ""), [profile.data]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Perfil atualizado!");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Minha conta</h1>
        <button onClick={signOut} className="rounded-full border border-border px-4 py-2 text-sm">Sair</button>
      </div>
      {profile.data?.status === "suspended" && (
        <p className="mt-4 rounded-xl bg-destructive/20 p-3 text-sm">Sua conta está suspensa. Você não pode comentar no momento.</p>
      )}
      {isAdmin && <Link to="/admin" className="mt-4 inline-block text-sm text-primary">Abrir painel administrativo →</Link>}
      <section className="mt-8 space-y-3 rounded-2xl bg-card p-5">
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <label className="block text-sm font-medium">Nome exibido</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <button onClick={save} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Salvar</button>
      </section>
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Meus comentários</h2>
        {comments.data?.length === 0 && <p className="text-sm text-muted-foreground">Você ainda não comentou.</p>}
        <ul className="space-y-2">
          {comments.data?.map((c) => {
            const v = c.videos as { title: string; slug: string } | null;
            return (
              <li key={c.id} className="rounded-xl bg-card p-3 text-sm">
                {v && <Link to="/video/$slug" params={{ slug: v.slug }} className="text-xs text-primary">{v.title}</Link>}
                <p className="mt-1">{c.body}</p>
                {c.status === "hidden" && <p className="mt-1 text-xs text-muted-foreground">Oculto pela moderação</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
