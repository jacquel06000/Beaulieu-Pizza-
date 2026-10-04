"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "../auth/password-input";
import { Alert, Button, Card, Field, inputClass } from "../ui";

function useStatus() {
  const [msg, setMsg] = useState<{ tone: "success" | "critical"; text: string } | null>(null);
  return { msg, ok: (text: string) => setMsg({ tone: "success", text }), ko: (text: string) => setMsg({ tone: "critical", text }) };
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const router = useRouter();
  const s = useStatus();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), phone: f.get("phone") ?? "" }) });
    if (res.ok) {
      s.ok("Informations enregistrées.");
      router.refresh();
    } else s.ko((await res.json().catch(() => ({}))).message ?? "Erreur.");
  }
  return (
    <Card>
      <h2 className="text-lg font-bold mb-4">Mes informations</h2>
      <form onSubmit={submit} className="space-y-4">
        {s.msg && <Alert tone={s.msg.tone}>{s.msg.text}</Alert>}
        <Field id="acc-email" label="Adresse e-mail" hint="Pour la modifier, contactez-nous.">
          <input id="acc-email" className={inputClass} value={email} disabled readOnly />
        </Field>
        <Field id="acc-name" label="Prénom ou pseudo">
          <input id="acc-name" name="name" defaultValue={name} required maxLength={80} className={inputClass} />
        </Field>
        <Field id="acc-phone" label="Téléphone" optional>
          <input id="acc-phone" name="phone" type="tel" defaultValue={phone} className={inputClass} />
        </Field>
        <Button type="submit">Enregistrer</Button>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const s = useStatus();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const newPassword = String(f.get("new") ?? "");
    if (newPassword.length < 10) return s.ko("10 caractères minimum.");
    const { error } = await authClient.changePassword({ currentPassword: String(f.get("current") ?? ""), newPassword, revokeOtherSessions: true });
    if (error) s.ko("Mot de passe actuel incorrect.");
    else {
      s.ok("Mot de passe modifié. Vos autres appareils ont été déconnectés.");
      form.reset();
    }
  }
  return (
    <Card>
      <h2 className="text-lg font-bold mb-4">Mot de passe</h2>
      <form onSubmit={submit} className="space-y-4">
        {s.msg && <Alert tone={s.msg.tone}>{s.msg.text}</Alert>}
        <Field id="pw-current" label="Mot de passe actuel">
          <PasswordInput id="pw-current" name="current" autoComplete="current-password" required />
        </Field>
        <Field id="pw-new" label="Nouveau mot de passe" hint="10 caractères minimum.">
          <PasswordInput id="pw-new" name="new" autoComplete="new-password" required />
        </Field>
        <Button type="submit">Modifier</Button>
      </form>
    </Card>
  );
}

export function ConsentForm({ marketing }: { marketing: boolean }) {
  const [value, setValue] = useState(marketing);
  const s = useStatus();
  async function change(v: boolean) {
    setValue(v);
    const res = await fetch("/api/account/consents", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketingEmail: v }) });
    if (res.ok) s.ok(v ? "Merci ! Vous recevrez nos actualités." : "C'est noté, vous ne recevrez plus nos actualités.");
    else {
      setValue(!v);
      s.ko("Erreur, réessayez.");
    }
  }
  return (
    <Card>
      <h2 className="text-lg font-bold mb-2">Communications</h2>
      <p className="text-sm text-muted mb-4">Les e-mails liés à votre compte et à votre abonnement (sécurité, paiement, résiliation) sont toujours envoyés.</p>
      {s.msg && <Alert tone={s.msg.tone} className="mb-4">{s.msg.text}</Alert>}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" className="mt-0.5 size-5 accent-ink" checked={value} onChange={(e) => change(e.target.checked)} />
        <span>
          <strong>Facultatif —</strong> j&apos;accepte de recevoir par e-mail les actualités et offres de Runelio. Je peux retirer ce consentement à tout moment ici ou via le lien présent dans chaque e-mail.
        </span>
      </label>
    </Card>
  );
}

export function ReminderForm({ enabled }: { enabled: boolean }) {
  const [value, setValue] = useState(enabled);
  const s = useStatus();
  async function change(v: boolean) {
    setValue(v);
    const res = await fetch("/api/account/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reminderEmail: v }) });
    if (res.ok) s.ok(v ? "Rappels activés : vous recevrez un e-mail la veille de chaque séance, vers 17 h." : "Rappels désactivés.");
    else {
      setValue(!v);
      s.ko("Erreur, réessayez.");
    }
  }
  return (
    <Card>
      <h2 className="text-lg font-bold mb-2">Rappels</h2>
      {s.msg && <Alert tone={s.msg.tone} className="mb-4">{s.msg.text}</Alert>}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" className="mt-0.5 size-5 accent-ink" checked={value} onChange={(e) => change(e.target.checked)} />
        <span>Recevoir un e-mail la veille de chaque séance, avec son contenu (envoyé vers 17 h).</span>
      </label>
    </Card>
  );
}

export function DataActions() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function remove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const { error } = await authClient.deleteUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Suppression impossible : vérifiez votre mot de passe.");
      return;
    }
    router.push("/?compte=supprime");
    router.refresh();
  }
  return (
    <Card>
      <h2 className="text-lg font-bold mb-2">Mes données</h2>
      <p className="text-sm text-muted leading-relaxed">Téléchargez l&apos;ensemble des données associées à votre compte (format JSON).</p>
      <a href="/api/account/export" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-semibold ring-1 ring-line hover:ring-ink/30">Exporter mes données</a>
      <hr className="my-6 border-line" />
      <h3 className="font-bold text-danger">Supprimer mon compte</h3>
      <p className="mt-1 text-sm text-muted leading-relaxed">
        Suppression définitive du compte, du questionnaire et des programmes. Un abonnement en cours est résilié immédiatement (sans remboursement automatique de la période entamée). Les factures sont conservées pendant la durée légale.
      </p>
      {!confirming ? (
        <Button variant="secondary" className="mt-4 text-danger" onClick={() => setConfirming(true)}>Supprimer mon compte…</Button>
      ) : (
        <form onSubmit={remove} className="mt-4 space-y-3">
          {error && <Alert tone="critical">{error}</Alert>}
          <Field id="del-pw" label="Confirmez avec votre mot de passe">
            <PasswordInput id="del-pw" name="password" autoComplete="current-password" required />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>Annuler</Button>
            <Button type="submit" variant="danger" disabled={loading}>Supprimer définitivement</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Se déconnecter
    </Button>
  );
}
