import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminInput, adminBtn, ghostBtn } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesAdmin,
});

type C = { id: string; slug: string; name: string; description: string; position: number };
const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<C>>({});
  const { data } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const [cats, vids] = await Promise.all([
        supabase.from("categories").select("*").order("position"),
        supabase.from("videos").select("category_id"),
      ]);
      const counts: Record<string, number> = {};
      vids.data?.forEach((v) => { if (v.category_id) counts[v.category_id] = (counts[v.category_id] ?? 0) + 1; });
      return { cats: (cats.data ?? []) as C[], counts };
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const save = async () => {
    if (!form.name) { toast.error("Informe o nome."); return; }
    const { error } = form.id
      ? await supabase.from("categories").update({ name: form.name, description: form.description ?? "" }).eq("id", form.id)
      : await supabase.from("categories").insert({ name: form.name, description: form.description ?? "", slug: slugify(form.name), position: (data?.cats.length ?? 0) + 1 });
    if (error) { toast.error(error.message.includes("duplicate") ? "Já existe uma categoria com esse nome." : "Não foi possível salvar."); return; }
    toast.success("Categoria salva");
    setForm({});
    refresh();
  };
  const remove = async (c: C) => {
    if (!confirm(`Excluir a categoria "${c.name}"? Os vídeos ficarão sem categoria.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    refresh();
  };
  const move = async (i: number, dir: -1 | 1) => {
    const cats = data!.cats;
    const a = cats[i]!, b = cats[i + dir];
    if (!b) return;
    await Promise.all([
      supabase.from("categories").update({ position: b.position }).eq("id", a.id),
      supabase.from("categories").update({ position: a.position }).eq("id", b.id),
    ]);
    refresh();
  };

  return (
    <>
      <PageTitle title="Categorias" subtitle="Crie, edite e ordene as categorias do site" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={form.id ? "Editar categoria" : "Nova categoria"}>
          <div className="space-y-3">
            <input className={`${adminInput} w-full`} placeholder="Nome" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea className={`${adminInput} w-full`} rows={3} placeholder="Descrição" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <button className={adminBtn} onClick={save}>Salvar</button>
              {form.id && <button className={ghostBtn} onClick={() => setForm({})}>Cancelar</button>}
            </div>
          </div>
        </Panel>
        <Panel className="lg:col-span-2">
          <ul className="divide-y divide-border">
            {data?.cats.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <div className="flex flex-col">
                  <button aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button aria-label="Descer" disabled={i === data.cats.length - 1} onClick={() => move(i, 1)} className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{data.counts[c.id] ?? 0} vídeos · {c.description}</p>
                </div>
                <button className={ghostBtn} onClick={() => setForm(c)}>Editar</button>
                <button className={`${ghostBtn} text-destructive`} onClick={() => remove(c)}>Excluir</button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
