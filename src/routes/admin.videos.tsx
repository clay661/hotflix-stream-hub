import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminInput, adminBtn, ghostBtn, num } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/videos")({
  component: VideosAdmin,
});

const PAGE = 10;
type V = { id: string; slug: string; title: string; description: string; thumb: string; video_url: string; duration: string; category_id: string | null; creator_id: string | null; published: boolean; views: number; published_at: string };

const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function VideosAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Partial<V> | null>(null);

  const cats = useQuery({ queryKey: ["admin-cats-lite"], queryFn: async () => (await supabase.from("categories").select("id, name").order("position")).data ?? [] });
  const creators = useQuery({ queryKey: ["admin-creators-lite"], queryFn: async () => (await supabase.from("creators").select("id, name").order("name")).data ?? [] });
  const list = useQuery({
    queryKey: ["admin-videos", q, cat, page],
    queryFn: async () => {
      let query = supabase.from("videos").select("*", { count: "exact" }).order("published_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (q) query = query.ilike("title", `%${q}%`);
      if (cat) query = query.eq("category_id", cat);
      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: data as V[], count: count ?? 0 };
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-videos"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const togglePublish = async (v: V) => {
    const { error } = await supabase.from("videos").update({ published: !v.published }).eq("id", v.id);
    if (error) { toast.error("Falha ao atualizar."); return; }
    toast.success(v.published ? "Vídeo despublicado" : "Vídeo publicado");
    refresh();
  };
  const remove = async (v: V) => {
    if (!confirm(`Excluir "${v.title}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("videos").delete().eq("id", v.id);
    if (error) { toast.error("Falha ao excluir."); return; }
    toast.success("Vídeo excluído");
    refresh();
  };
  const save = async () => {
    if (!editing?.title) { toast.error("Informe o título."); return; }
    const payload = {
      title: editing.title,
      description: editing.description ?? "",
      thumb: editing.thumb ?? "",
      video_url: editing.video_url ?? "",
      duration: editing.duration ?? "0:00",
      category_id: editing.category_id || null,
      creator_id: editing.creator_id || null,
      published: editing.published ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("videos").update(payload).eq("id", editing.id)
      : await supabase.from("videos").insert({ ...payload, slug: `${slugify(editing.title)}-${Date.now().toString(36)}` });
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Vídeo salvo");
    setEditing(null);
    refresh();
  };

  const pages = Math.max(1, Math.ceil((list.data?.count ?? 0) / PAGE));
  const catName = (id: string | null) => cats.data?.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <PageTitle title="Vídeos" subtitle={`${list.data?.count ?? 0} vídeos`} action={<button className={`${adminBtn} inline-flex items-center gap-1`} onClick={() => setEditing({ published: false })}><Plus className="h-4 w-4" />Novo vídeo</button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className={`${adminInput} flex flex-1 items-center gap-2`}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Buscar por título" className="w-full bg-transparent outline-none" />
        </label>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }} className={adminInput}>
          <option value="">Todas as categorias</option>
          {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <Panel>
        <div className="divide-y divide-border">
          {list.data?.rows.map((v) => (
            <div key={v.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <img src={v.thumb} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{catName(v.category_id)} · {num(v.views)} views · {v.duration}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${v.published ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{v.published ? "Publicado" : "Rascunho"}</span>
                <button className={ghostBtn} onClick={() => setEditing(v)}>Editar</button>
                <button className={ghostBtn} onClick={() => togglePublish(v)}>{v.published ? "Despublicar" : "Publicar"}</button>
                <button className={`${ghostBtn} text-destructive`} onClick={() => remove(v)}>Excluir</button>
              </div>
            </div>
          ))}
          {list.data?.rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum vídeo encontrado.</p>}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button className={ghostBtn} disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span className="text-muted-foreground">Página {page + 1} de {pages}</span>
          <button className={ghostBtn} disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      </Panel>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg space-y-3 rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? "Editar vídeo" : "Novo vídeo"}</h2>
            <input className={`${adminInput} w-full`} placeholder="Título" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <textarea className={`${adminInput} w-full`} rows={3} placeholder="Descrição" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <input className={`${adminInput} w-full`} placeholder="URL da miniatura" value={editing.thumb ?? ""} onChange={(e) => setEditing({ ...editing, thumb: e.target.value })} />
            {editing.thumb && <img src={editing.thumb} alt="" className="aspect-video w-full rounded-xl object-cover" />}
            <input className={`${adminInput} w-full`} placeholder="URL do vídeo" value={editing.video_url ?? ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className={adminInput} value={editing.category_id ?? ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}>
                <option value="">Categoria</option>
                {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={adminInput} value={editing.creator_id ?? ""} onChange={(e) => setEditing({ ...editing, creator_id: e.target.value })}>
                <option value="">Criador</option>
                {creators.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className={adminInput} placeholder="Duração (ex: 12:30)" value={editing.duration ?? ""} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />Publicado</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className={ghostBtn} onClick={() => setEditing(null)}>Cancelar</button>
              <button className={adminBtn} onClick={save}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
