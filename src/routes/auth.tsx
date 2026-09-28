import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Hotflix" },
      { name: "description", content: "Acesse sua conta Hotflix para comentar, favoritar e acompanhar criadores." },
      { property: "og:title", content: "Entrar — Hotflix" },
      { property: "og:description", content: "Acesse ou crie sua conta Hotflix." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

export const inputCls = "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary";
export const primaryBtn = "w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (user) nav({ to: "/conta", replace: true });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
        });
        if (error) throw error;
        setSent("Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar a conta.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha incorretos." : msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com o Google.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold">
        {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "forgot" ? "Informe seu e-mail para receber o link." : "Comente, favorite e acompanhe seus criadores."}
      </p>
      {sent ? (
        <div className="mt-8 rounded-xl bg-card p-5 text-sm">{sent}</div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-3">
          {mode === "signup" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={inputCls} />}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className={inputCls} />
          {mode !== "forgot" && (
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className={inputCls} />
          )}
          <button disabled={busy} className={primaryBtn}>
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </button>
          {mode !== "forgot" && (
            <button type="button" onClick={google} className="w-full rounded-xl border border-border py-3 text-sm font-semibold hover:bg-secondary">
              Continuar com Google
            </button>
          )}
        </form>
      )}
      <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
        {mode === "login" && (
          <>
            <button onClick={() => setMode("forgot")} className="text-left hover:text-foreground">Esqueci minha senha</button>
            <button onClick={() => setMode("signup")} className="text-left">Não tem conta? <span className="text-primary">Cadastre-se</span></button>
          </>
        )}
        {mode !== "login" && (
          <button onClick={() => { setMode("login"); setSent(null); }} className="text-left">Já tem conta? <span className="text-primary">Entrar</span></button>
        )}
        <Link to="/" className="hover:text-foreground">Voltar ao início</Link>
      </div>
    </div>
  );
}
