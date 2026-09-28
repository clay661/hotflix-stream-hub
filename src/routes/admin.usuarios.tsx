import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deleteUser } from "@/lib/admin.functions";
import { PageTitle, Panel, adminInput, ghostBtn } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/usuarios")({
  component: UsersAdmin,
});

const PAGE = 15;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");

function UsersAdmin() {
  const qc = useQueryClient();
  const del = useServerFn(deleteUser);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data } = useQuery({
    queryKey: ["admin-users", q, page],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (q) query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
      const { data: rows, count } = await query;
      const ids = (rows ?? []).map((r) => r.id);
      const [comments, roles] = await Promise.all([
        ids.length ? supabase.from("comments").select("user_id").in("user_id", ids) : Promise.resolve({ data: [] as { user_id: string }[] }),
        ids.length ? supabase.from("user_roles").select("user_id, role").in("user_id", ids).eq("role", "admin") : Promise.resolve({ data: [] as { user_id: string }[] }),
      ]);
      const cc: Record<string, number> = {};
      comments.data?.forEach((c) => (cc[c.user_id] = (cc[c.user_id] ?? 0) + 1));
      const admins = new Set(roles.data?.map((r) => r.user_id));
      return { rows: rows ?? [], count: count ?? 0, cc, admins };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const setStatus = async (id: string, status: "active" | "suspended") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) { toast.error("Falha ao atualizar."); return; }
    toast.success(status === "suspended" ? "Usuário suspenso" : "Usuário reativado");
    refresh();
  };
  const remove = async (id: string, email: string | null) => {
    if (!confirm(`Excluir definitivamente ${email ?? "este usuário"}?`)) return;
    try {
      await del({ data: { userId: id } });
      toast.success("Usuário excluído");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  };
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE));

  return (
    <>
      <PageTitle title="Usuários" subtitle={`${data?.count ?? 0} contas cadastradas`} />
      <label className={`${adminInput} mb-4 flex items-center gap-2`}>
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value.replace(/[,()]/g, "")); setPage(0); }} placeholder="Buscar por nome ou e-mail" className="w-full bg-transparent outline-none" />
      </label>
      <Panel>
        <div className="divide-y divide-border">
          {data?.rows.map((u) => (
            <div key={u.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {u.display_name ?? "Sem nome"}
                  {data.admins.has(u.id) && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">admin</span>}
                  {u.status === "suspended" && <span className="ml-2 rounded-full bg-destructive/20 px-2 py-0.5 text-xs">suspenso</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">Cadastro: {fmt(u.created_at)} · Última atividade: {fmt(u.last_seen_at)} · {data.cc[u.id] ?? 0} comentários</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {u.status === "suspended" ? (
                  <button className={ghostBtn} onClick={() => setStatus(u.id, "active")}>Reativar</button>
                ) : (
                  <button className={ghostBtn} onClick={() => setStatus(u.id, "suspended")}>Suspender</button>
                )}
                <button className={`${ghostBtn} text-destructive`} onClick={() => remove(u.id, u.email)}>Excluir</button>
              </div>
            </div>
          ))}
          {data?.rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button className={ghostBtn} disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span className="text-muted-foreground">Página {page + 1} de {pages}</span>
          <button className={ghostBtn} disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      </Panel>
    </>
  );
}
