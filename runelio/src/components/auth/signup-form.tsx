"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Alert, Button, Field, inputClass } from "../ui";
import { PasswordInput } from "./password-input";

export function SignupForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name") ?? "").trim(),
      email: String(f.get("email") ?? "").trim().toLowerCase(),
      password: String(f.get("password") ?? ""),
      confirm: String(f.get("confirm") ?? ""),
      phone: String(f.get("phone") ?? "").trim(),
      terms: f.get("terms") === "on",
    };
    const errs: Record<string, string> = {};
    if (!data.name) errs.name = "Indiquez un prénom ou un pseudo.";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) errs.email = "Adresse e-mail invalide.";
    if (data.password.length < 10) errs.password = "10 caractères minimum.";
    if (data.password !== data.confirm) errs.confirm = "Les mots de passe ne correspondent pas.";
    if (data.phone && !/^\+?[0-9 .-]{6,20}$/.test(data.phone)) errs.phone = "Numéro invalide.";
    if (!data.terms) errs.terms = "Vous devez accepter les conditions générales d'utilisation.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("loading");
    setFormError(null);
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
      callbackURL: "/espace/questionnaire",
    });
    if (error) {
      setStatus("idle");
      setFormError(error.status === 429 ? "Trop de tentatives, réessayez dans quelques minutes." : (error.message ?? "Inscription impossible."));
      return;
    }
    setEmail(data.email);
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <Alert tone="success" title="Vérifiez votre boîte e-mail">
        Si l&apos;adresse <strong>{email}</strong> peut être utilisée, un lien de confirmation vient d&apos;y être envoyé (valable 24 h). Pensez à regarder dans les indésirables.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="critical">{formError}</Alert>}
      <Field id="name" label="Prénom ou pseudo" error={errors.name}>
        <input id="name" name="name" autoComplete="given-name" className={inputClass} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
      </Field>
      <Field id="email" label="Adresse e-mail" error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" className={inputClass} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
      </Field>
      <Field id="password" label="Mot de passe" hint="10 caractères minimum. Une phrase de passe est idéale." error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : "password-hint"} />
      </Field>
      <Field id="confirm" label="Confirmez le mot de passe" error={errors.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} />
      </Field>
      <Field id="phone" label="Téléphone" optional hint="Utilisé uniquement pour vous contacter au sujet de votre compte si nécessaire." error={errors.phone}>
        <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputClass} aria-invalid={!!errors.phone} />
      </Field>
      <div>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="terms" className="mt-0.5 size-5 shrink-0 accent-ink" aria-invalid={!!errors.terms} />
          <span>
            J&apos;accepte les <Link href="/legal/cgu-cgv" className="underline" target="_blank">conditions générales d&apos;utilisation</Link> et j&apos;ai pris connaissance de la{" "}
            <Link href="/legal/confidentialite" className="underline" target="_blank">politique de confidentialité</Link>.
          </span>
        </label>
        {errors.terms && <p className="mt-1 text-xs font-medium text-danger">{errors.terms}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Création…" : "Créer mon compte gratuit"}
      </Button>
      <p className="text-center text-sm text-muted">
        Déjà inscrit ? <Link href="/connexion" className="font-semibold text-ink underline">Se connecter</Link>
      </p>
    </form>
  );
}
