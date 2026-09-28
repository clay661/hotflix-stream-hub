import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Row = { id: string; body: string; user_id: string; parent_id: string | null; created_at: string; updated_at: string; status: string };

const timeAgo = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function Comments({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["comments", videoId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("comments")
        .select("id, body, user_id, parent_id, created_at, updated_at, status")
        .eq("video_id", videoId)
        .eq("status", "active")
        .order("created_at");
      const list = (rows ?? []) as Row[];
      const ids = [...new Set(list.map((r) => r.user_id))];
      const { data: authors } = ids.length ? await supabase.rpc("comment_authors", { _ids: ids }) : { data: [] };
      const names = Object.fromEntries((authors ?? []).map((a) => [a.id, a.display_name ?? "Usuário"]));
      return { list, names };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const post = async (body: string, parent_id: string | null) => {
    if (!user) return false;
    const { error } = await supabase.from("comments").insert({ video_id: videoId, user_id: user.id, body, parent_id });
    if (error) {
      toast.error(error.message.includes("row-level") ? "Sua conta não pode comentar no momento." : "Não foi possível comentar.");
      return false;
    }
    refresh();
    return true;
  };

  const top = data?.list.filter((c) => !c.parent_id) ?? [];
  const replies = (id: string) => data?.list.filter((c) => c.parent_id === id) ?? [];

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-bold">Comentários {data ? `(${data.list.length})` : ""}</h2>
      {user ? (
        <Composer onSubmit={(b) => post(b, null)} placeholder="Escreva um comentário..." />
      ) : (
        <p className="rounded-xl bg-card p-4 text-sm">
          <Link to="/auth" className="font-semibold text-primary">Entre</Link> para comentar.
        </p>
      )}
      <ul className="mt-6 space-y-5">
        {top.map((c) => (
          <li key={c.id}>
            <CommentItem c={c} name={data!.names[c.user_id]} onChange={refresh} onReply={(b) => post(b, c.id)} />
            {replies(c.id).length > 0 && (
              <ul className="ml-10 mt-3 space-y-3 border-l border-border pl-4">
                {replies(c.id).map((r) => (
                  <li key={r.id}><CommentItem c={r} name={data!.names[r.user_id]} onChange={refresh} /></li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {data && top.length === 0 && <p className="mt-6 text-sm text-muted-foreground">Seja o primeiro a comentar.</p>}
    </section>
  );
}

function Composer({ onSubmit, placeholder, initial = "", onCancel }: { onSubmit: (b: string) => Promise<boolean>; placeholder: string; initial?: string; onCancel?: () => void }) {
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        const ok = await onSubmit(body.trim());
        setBusy(false);
        if (ok && !initial) setBody("");
      }}
      className="space-y-2"
    >
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={2} placeholder={placeholder} className="w-full resize-none rounded-xl border border-border bg-secondary p-3 text-sm outline-none focus:border-primary" />
      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-full px-4 py-1.5 text-sm text-muted-foreground">Cancelar</button>}
        <button disabled={busy || !body.trim()} className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Publicar</button>
      </div>
    </form>
  );
}

function CommentItem({ c, name, onChange, onReply }: { c: Row; name?: string; onChange: () => void; onReply?: (b: string) => Promise<boolean> }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const mine = user?.id === c.user_id;
  const display = name ?? "Usuário";

  const edit = async (body: string) => {
    const { error } = await supabase.from("comments").update({ body }).eq("id", c.id);
    if (error) { toast.error("Não foi possível editar."); return false; }
    setEditing(false);
    onChange();
    return true;
  };
  const remove = async () => {
    if (!confirm("Excluir este comentário?")) return;
    const { error } = await supabase.from("comments").update({ status: "deleted" }).eq("id", c.id);
    if (error) return toast.error("Não foi possível excluir.");
    onChange();
  };

  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold">{display[0]!.toUpperCase()}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs"><span className="font-semibold">{display}</span> <span className="text-muted-foreground">· {timeAgo(c.created_at)}{c.updated_at !== c.created_at ? " · editado" : ""}</span></p>
        {editing ? (
          <div className="mt-2"><Composer initial={c.body} onSubmit={edit} placeholder="" onCancel={() => setEditing(false)} /></div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.body}</p>
        )}
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          {onReply && user && <button onClick={() => setReplying(!replying)} className="hover:text-foreground">Responder</button>}
          {mine && !editing && <button onClick={() => setEditing(true)} className="hover:text-foreground">Editar</button>}
          {mine && <button onClick={remove} className="hover:text-destructive">Excluir</button>}
        </div>
        {replying && onReply && (
          <div className="mt-2">
            <Composer placeholder={`Responder a ${display}...`} onCancel={() => setReplying(false)} onSubmit={async (b) => { const ok = await onReply(b); if (ok) setReplying(false); return ok; }} />
          </div>
        )}
      </div>
    </div>
  );
}
