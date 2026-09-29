"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Alert, Button, Field } from "../ui";
import { PasswordInput } from "./password-input";

export function ResetForm({ token }: { token: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  if (!token) return <Alert tone="critical">Lien invalide ou expiré. <Link href="/mot-de-passe-oublie" className="underline">Demander un nouveau lien</Link>.</Alert>;
  if (state === "done") {
    return (
      <Alert tone="success">
        Mot de passe modifié. Vos autres sessions ont été déconnectées. <Link href="/connexion" className="font-semibold underline">Se connecter</Link>
      </Alert>
    );
  }
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password") ?? "");
    if (pw.length < 10) return setError("10 caractères minimum.");
    if (pw !== f.get("confirm")) return setError("Les mots de passe ne correspondent pas.");
    setState("loading");
    const { error } = await authClient.resetPassword({ newPassword: pw, token: token! });
    if (error) {
      setState("idle");
      setError("Lien invalide ou expiré. Demandez un nouveau lien.");
      return;
    }
    setState("done");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <Alert tone="critical">{error}</Alert>}
      <Field id="password" label="Nouveau mot de passe" hint="10 caractères minimum.">
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </Field>
      <Field id="confirm" label="Confirmation">
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </Field>
      <Button type="submit" className="w-full" disabled={state === "loading"}>Enregistrer</Button>
    </form>
  );
}
