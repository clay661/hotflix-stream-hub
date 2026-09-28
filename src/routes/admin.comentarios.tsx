import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminInput, ghostBtn } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/comentarios")({
  component: CommentsAdmin,
});

const PAGE = 20;
const badge: Record<string, string> = { active: "bg-primary/15 text-primary", hidden: "bg-secondary text-muted-foreground", deleted: "bg-destructive/20" };
const label: Record<string, string> = { active: "ativo", hidden: "oculto", deleted: "excluído" };

function CommentsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const { data } = useQuery({
    queryKey: ["admin-comments", q, status, page],
    queryFn: async () => {
      let query = supabase.from("comments").select("id, body, status, created_at, user_id, videos(title)", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (q) query = query.ilike("body", `%${q}%`);
      if (status) query = query.eq("status", status);
      const { data: rows, count } = await query;
      const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id, display_name, email").in("id", ids) : { data: [] };
      const names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name ?? p.email]));
      return { rows: rows ?? [], count: count ?? 0, names };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-comments"] });
  const set = async (id: string, s: "active" | "hidden" | "deleted") => {
    const { error } = await supabase.from("comments").update({ status: s }).eq("id", id);
    if (error) { toast.error("Falha ao atualizar."); return; }
    refresh();
  };
  const purge = async (id: string) => {
    if (!confirm("Apagar definitivamente este comentário?")) return;
    await supabase.from("comments").delete().eq("id", id);
    refresh();
  };
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE));

  return (
    <>
      <PageTitle title="Comentários" subtitle="Moderação dos comentários dos vídeos" />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className={`${adminInput} flex flex-1 items-center gap-2`}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Buscar no texto" className="w-full bg-transparent outline-none" />
        </label>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className={adminInput}>
          <option value="">Todos</option><option value="active">Ativos</option><option value="hidden">Ocultos</option><option value="deleted">Excluídos</option>
        </select>
      </div>
      <Panel>
        <div className="divide-y divide-border">
          {data?.rows.map((c) => (
            <div key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{data.names[c.user_id] ?? "Usuário"}</span> em {(c.videos as { title: string } | null)?.title ?? "—"} · {new Date(c.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <p className="mt-1 break-words text-sm">{c.body}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${badge[c.status]}`}>{label[c.status]}</span>
                {c.status !== "hidden" && <button className={ghostBtn} onClick={() => set(c.id, "hidden")}>Ocultar</button>}
                {c.status !== "active" && <button className={ghostBtn} onClick={() => set(c.id, "active")}>Restaurar</button>}
                {c.status !== "deleted" ? (
                  <button className={`${ghostBtn} text-destructive`} onClick={() => set(c.id, "deleted")}>Excluir</button>
                ) : (
                  <button className={`${ghostBtn} text-destructive`} onClick={() => purge(c.id)}>Apagar</button>
                )}
              </div>
            </div>
          ))}
          {data?.rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum comentário encontrado.</p>}
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
