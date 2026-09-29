"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Alert, Button, Field, inputClass } from "../ui";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    await authClient.requestPasswordReset({ email, redirectTo: "/reinitialiser-mot-de-passe" });
    setLoading(false);
    // Message identique que le compte existe ou non (pas d'énumération des comptes).
    setSent(true);
  }
  if (sent) {
    return <Alert tone="success">Si un compte correspond à cette adresse, un lien de réinitialisation (valable 30 minutes) vient d&apos;être envoyé.</Alert>;
  }
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field id="email" label="Adresse e-mail du compte">
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>Recevoir un lien</Button>
    </form>
  );
}
