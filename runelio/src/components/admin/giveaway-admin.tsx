"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Badge, Button, Card, Field, inputClass } from "../ui";

export type AdminGiveaway = {
  id: string;
  title: string;
  prizeDescription: string;
  prizeValueCents: number;
  numberOfWinners: number;
  startsAt: string;
  endsAt: string;
  drawAt: string;
  eligibilityCriteria: string;
  drawMethod: string;
  rulesVersion: string | null;
  status: string;
  legalValidatedAt: string | null;
};

const toLocal = (iso: string) => iso.slice(0, 16);

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message ?? "Erreur");
  return r.json();
}

function GiveawayForm({ initial, onDone }: { initial?: AdminGiveaway; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get("title"),
      prizeDescription: f.get("prizeDescription"),
      prizeValueCents: Math.round(Number(f.get("prizeValue")) * 100),
      numberOfWinners: Number(f.get("numberOfWinners")),
      startsAt: new Date(String(f.get("startsAt"))).toISOString(),
      endsAt: new Date(String(f.get("endsAt"))).toISOString(),
      drawAt: new Date(String(f.get("drawAt"))).toISOString(),
      eligibilityCriteria: f.get("eligibilityCriteria"),
      drawMethod: f.get("drawMethod"),
      rulesVersion: String(f.get("rulesVersion") ?? "") || null,
    };
    try {
      await call(initial ? `/api/admin/giveaways/${initial.id}` : "/api/admin/giveaways", initial ? "PUT" : "POST", body);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert tone="critical">{error}</Alert>}
      <Field id="g-title" label="Titre"><input id="g-title" name="title" required defaultValue={initial?.title} className={inputClass} /></Field>
      <Field id="g-prize" label="Description du lot"><textarea id="g-prize" name="prizeDescription" required defaultValue={initial?.prizeDescription} className={inputClass} rows={3} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="g-val" label="Valeur commerciale (€)"><input id="g-val" name="prizeValue" type="number" step="0.01" min="0" required defaultValue={initial ? initial.prizeValueCents / 100 : undefined} className={inputClass} /></Field>
        <Field id="g-win" label="Nombre de gagnants"><input id="g-win" name="numberOfWinners" type="number" min="1" required defaultValue={initial?.numberOfWinners ?? 1} className={inputClass} /></Field>
        <Field id="g-start" label="Début des participations"><input id="g-start" name="startsAt" type="datetime-local" required defaultValue={initial && toLocal(initial.startsAt)} className={inputClass} /></Field>
        <Field id="g-end" label="Clôture"><input id="g-end" name="endsAt" type="datetime-local" required defaultValue={initial && toLocal(initial.endsAt)} className={inputClass} /></Field>
        <Field id="g-draw" label="Date du tirage"><input id="g-draw" name="drawAt" type="datetime-local" required defaultValue={initial && toLocal(initial.drawAt)} className={inputClass} /></Field>
        <Field id="g-rules" label="Version du règlement publié" hint="Vide tant que le règlement n'est pas rédigé et publié."><input id="g-rules" name="rulesVersion" defaultValue={initial?.rulesVersion ?? ""} className={inputClass} /></Field>
      </div>
      <Field id="g-elig" label="Critères de participation"><textarea id="g-elig" name="eligibilityCriteria" required minLength={10} defaultValue={initial?.eligibilityCriteria} className={inputClass} rows={3} /></Field>
      <Field id="g-method" label="Modalités du tirage au sort"><textarea id="g-method" name="drawMethod" required minLength={10} defaultValue={initial?.drawMethod} className={inputClass} rows={3} /></Field>
      <Button type="submit">{initial ? "Enregistrer (annule la validation)" : "Créer le brouillon"}</Button>
    </form>
  );
}

function Validate({ id, onDone }: { id: string; onDone: () => void }) {
  const [legal, setLegal] = useState(false);
  const [published, setPublished] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3 rounded-xl bg-warn-soft p-4">
      <p className="text-sm font-semibold">Validation juridique (France)</p>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={legal} onChange={(e) => setLegal(e.target.checked)} className="size-4 accent-ink" /> Les lots, conditions de participation et le règlement ont été validés au regard du droit français (loteries, pratiques commerciales, fiscalité des lots).</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="size-4 accent-ink" /> Le règlement définitif est publié sur /legal/reglement-cadeaux (et, le cas échéant, déposé).</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Référence de la validation (conseil, date, dépôt…)" className={inputClass} rows={2} />
      {error && <Alert tone="critical">{error}</Alert>}
      <Button
        disabled={!legal || !published}
        onClick={async () => {
          try {
            await call(`/api/admin/giveaways/${id}/validate`, "POST", { legalReviewDone: legal, rulesPublished: published, note });
            onDone();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Valider
      </Button>
    </div>
  );
}

export function GiveawayAdmin({ giveaways, enabled }: { giveaways: AdminGiveaway[]; enabled: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const refresh = () => {
    setEditing(null);
    router.refresh();
  };
  const act = async (url: string) => {
    try {
      const r = await call(url, "POST");
      setMsg(r.participants !== undefined ? `Tirage effectué : ${r.winners} gagnant(s) parmi ${r.participants} participant(s).` : "Action effectuée.");
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <div className="space-y-4">
      {!enabled && <Alert tone="warning" title="Tirages désactivés">GIVEAWAYS_ENABLED est à false : aucun tirage ne peut être ouvert ni affiché aux abonnés. Ne l&apos;activez qu&apos;après publication d&apos;un règlement validé.</Alert>}
      {msg && <Alert tone="info">{msg}</Alert>}
      <Button variant="secondary" onClick={() => setEditing("new")}>Nouveau cadeau</Button>
      {editing === "new" && <Card><GiveawayForm onDone={refresh} /></Card>}
      {giveaways.map((g) => (
        <Card key={g.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">{g.title}</h3>
            <Badge tone={g.status === "open" ? "mint" : g.status === "validated" ? "sky" : "neutral"}>{g.status}</Badge>
          </div>
          <p className="text-sm text-muted mt-1">{(g.prizeValueCents / 100).toFixed(2)} € · {new Date(g.startsAt).toLocaleDateString("fr-FR")} → {new Date(g.endsAt).toLocaleDateString("fr-FR")} · règlement {g.rulesVersion ?? "non défini"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(g.status === "draft" || g.status === "validated") && <Button variant="secondary" onClick={() => setEditing(editing === g.id ? null : g.id)}>Modifier</Button>}
            {g.status === "validated" && <Button disabled={!enabled} onClick={() => act(`/api/admin/giveaways/${g.id}/open`)}>Ouvrir les participations</Button>}
            {g.status === "open" && <Button disabled={!enabled} onClick={() => act(`/api/admin/giveaways/${g.id}/draw`)}>Effectuer le tirage</Button>}
          </div>
          {editing === g.id && <div className="mt-4"><GiveawayForm initial={g} onDone={refresh} /></div>}
          {g.status === "draft" && <div className="mt-4"><Validate id={g.id} onDone={refresh} /></div>}
        </Card>
      ))}
    </div>
  );
}
