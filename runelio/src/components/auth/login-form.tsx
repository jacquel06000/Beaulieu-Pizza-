"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Alert, Button, Field, inputClass } from "../ui";
import { PasswordInput } from "./password-input";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/espace";
}

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    setLoading(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password: String(f.get("password") ?? ""), rememberMe: f.get("remember") === "on" });
    setLoading(false);
    if (error) {
      if (error.status === 403) {
        setUnverified(email);
        return;
      }
      setError(error.status === 429 ? "Trop de tentatives. Réessayez dans une minute." : "E-mail ou mot de passe incorrect.");
      return;
    }
    router.push(safeNext(next));
    router.refresh();
  }

  async function resend() {
    if (!unverified) return;
    await authClient.sendVerificationEmail({ email: unverified, callbackURL: "/espace/questionnaire" });
    setResent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <Alert tone="critical">{error}</Alert>}
      {unverified && (
        <Alert tone="warning" title="Adresse e-mail non confirmée">
          Confirmez votre adresse via le lien reçu par e-mail.{" "}
          {resent ? "Un nouveau lien a été envoyé." : <button type="button" onClick={resend} className="font-semibold underline">Renvoyer le lien</button>}
        </Alert>
      )}
      <Field id="email" label="Adresse e-mail">
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      <Field id="password" label="Mot de passe">
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="remember" defaultChecked className="size-4 accent-ink" /> Rester connecté
        </label>
        <Link href="/mot-de-passe-oublie" className="font-semibold underline">Mot de passe oublié ?</Link>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</Button>
      <p className="text-center text-sm text-muted">
        Pas encore de compte ? <Link href="/inscription" className="font-semibold text-ink underline">Créer un compte gratuit</Link>
      </p>
    </form>
  );
}
