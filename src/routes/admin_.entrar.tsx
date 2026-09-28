import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inputCls, primaryBtn } from "@/lib/ui-classes";

export const Route = createFileRoute("/admin_/entrar")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Hotflix" },
      { name: "description", content: "Entrada restrita ao painel administrativo da Hotflix." },
      { property: "og:title", content: "Acesso administrativo — Hotflix" },
      { property: "og:description", content: "Área restrita." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setBusy(false);
      { toast.error("E-mail ou senha incorretos."); return; }
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    setBusy(false);
    if (!isAdmin) {
      await supabase.auth.signOut();
      { toast.error("Esta conta não tem permissão de administrador."); return; }
    }
    nav({ to: "/admin" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-7">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 font-display text-xl font-extrabold"><span className="text-primary">HOT</span>FLIX Admin</p>
          <p className="mt-1 text-sm text-muted-foreground">Acesso restrito a administradores</p>
        </div>
        <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className={inputCls} />
        <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className={inputCls} />
        <button disabled={busy} className={primaryBtn}>{busy ? "Verificando..." : "Entrar no painel"}</button>
      </form>
    </div>
  );
}
