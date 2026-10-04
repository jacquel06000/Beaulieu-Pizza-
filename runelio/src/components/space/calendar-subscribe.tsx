"use client";

import { useState } from "react";
import { Alert, Button, Card } from "../ui";

/** Ajout du programme à Google Agenda / Apple Calendrier / Outlook. */
export function CalendarSubscribe() {
  const [links, setLinks] = useState<{ url: string; webcal: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function load(rotate = false) {
    setError(null);
    const res = await fetch("/api/account/calendar", { method: rotate ? "POST" : "GET" });
    if (!res.ok) return setError("Impossible d'obtenir le lien pour le moment.");
    setLinks(await res.json());
    setCopied(false);
  }

  async function copy() {
    if (!links) return;
    try {
      await navigator.clipboard.writeText(links.url);
      setCopied(true);
    } catch {
      setError("Copie impossible : sélectionnez le lien et copiez-le manuellement.");
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Ajouter à mon agenda</h2>
          <p className="text-sm text-muted">Vos séances apparaissent dans Google Agenda, Apple Calendrier ou Outlook, et se mettent à jour automatiquement.</p>
        </div>
        {!open && (
          <Button variant="secondary" onClick={() => { setOpen(true); load(); }}>
            Obtenir le lien
          </Button>
        )}
      </div>
      {error && <Alert tone="critical" className="mt-4">{error}</Alert>}
      {open && links && (
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={links.url} onFocus={(e) => e.currentTarget.select()} aria-label="Lien de l'agenda" className="min-h-11 w-full min-w-0 rounded-xl bg-paper px-3 font-mono text-xs ring-1 ring-line" />
            <Button variant="secondary" onClick={copy}>{copied ? "Copié ✓" : "Copier"}</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-paper p-4">
              <p className="font-semibold">iPhone / Mac</p>
              <a href={links.webcal} className="mt-2 inline-block font-semibold underline">Ouvrir dans Calendrier</a>
              <p className="mt-1 text-xs text-muted">Ou : Réglages → Calendrier → Comptes → Ajouter un calendrier avec abonnement, puis collez le lien.</p>
            </div>
            <div className="rounded-xl bg-paper p-4">
              <p className="font-semibold">Google Agenda</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Sur ordinateur : calendar.google.com → « Autres agendas » → « + » → « À partir de l&apos;URL », puis collez le lien. Google actualise ce type d&apos;agenda plusieurs fois par jour.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">
            Ce lien est personnel : toute personne qui le possède peut voir vos séances. En cas de doute,{" "}
            <button type="button" onClick={() => load(true)} className="font-semibold underline">générez un nouveau lien</button> (l&apos;ancien cesse de fonctionner).
          </p>
        </div>
      )}
    </Card>
  );
}
