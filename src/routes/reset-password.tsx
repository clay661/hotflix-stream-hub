import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inputCls, primaryBtn } from "@/lib/ui-classes";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Criar nova senha — Hotflix" },
      { name: "description", content: "Defina uma nova senha para sua conta Hotflix." },
      { property: "og:title", content: "Nova senha — Hotflix" },
      { property: "og:description", content: "Defina uma nova senha." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error("Link inválido ou expirado. Solicite um novo.");
    toast.success("Senha atualizada!");
    nav({ to: "/conta" });
  };
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold">Criar nova senha</h1>
      <form onSubmit={submit} className="mt-8 space-y-3">
        <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" className={inputCls} />
        <button disabled={busy} className={primaryBtn}>{busy ? "Salvando..." : "Salvar senha"}</button>
      </form>
    </div>
  );
}
