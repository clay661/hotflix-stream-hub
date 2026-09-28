import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminInput, adminBtn, ghostBtn } from "@/components/admin-ui";

export const Route = createFileRoute("/admin/configuracoes")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [cur, setCur] = useState("");
  const admins = useQuery({
    queryKey: ["admin-list"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const ids = roles?.map((r) => r.user_id) ?? [];
      if (!ids.length) return [];
      return (await supabase.from("profiles").select("id, email, display_name").in("id", ids)).data ?? [];
    },
  });

  const grant = async () => {
    const { data: p } = await supabase.from("profiles").select("id").ilike("email", email.trim()).maybeSingle();
    if (!p) { toast.error("Nenhuma conta cadastrada com esse e-mail."); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: p.id, role: "admin" });
    if (error && !error.message.includes("duplicate")) { toast.error("Não foi possível conceder acesso."); return; }
    toast.success("Administrador adicionado");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["admin-list"] });
  };
  const revoke = async (id: string) => {
    if (id === user.id) { toast.error("Você não pode remover seu próprio acesso."); return; }
    await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
    qc.invalidateQueries({ queryKey: ["admin-list"] });
  };
  const changePassword = async () => {
    const { error } = await supabase.auth.updateUser({ password: pwd, current_password: cur } as { password: string });
    if (error) { toast.error("Não foi possível alterar a senha. Confira a senha atual."); return; }
    toast.success("Senha alterada");
    setPwd(""); setCur("");
  };

  return (
    <>
      <PageTitle title="Configurações" subtitle="Acesso administrativo e segurança" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Administradores">
          <ul className="mb-4 divide-y divide-border">
            {admins.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate">{a.display_name} <span className="text-muted-foreground">· {a.email}</span></span>
                {a.id !== user.id && <button className={ghostBtn} onClick={() => revoke(a.id)}>Remover</button>}
              </li>
            ))}
          </ul>
          <p className="mb-2 text-xs text-muted-foreground">A pessoa precisa ter uma conta cadastrada no site.</p>
          <div className="flex gap-2">
            <input className={`${adminInput} min-w-0 flex-1`} type="email" placeholder="E-mail da conta" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className={adminBtn} onClick={grant} disabled={!email}>Adicionar</button>
          </div>
        </Panel>
        <Panel title="Alterar minha senha">
          <div className="space-y-2">
            <input className={`${adminInput} w-full`} type="password" placeholder="Senha atual" value={cur} onChange={(e) => setCur(e.target.value)} />
            <input className={`${adminInput} w-full`} type="password" minLength={6} placeholder="Nova senha" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <button className={adminBtn} onClick={changePassword} disabled={pwd.length < 6 || !cur}>Alterar senha</button>
          </div>
        </Panel>
      </div>
    </>
  );
}
