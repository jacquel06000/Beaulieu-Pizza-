"use client";
import { useState } from "react";
import { Alert, Button } from "../ui";

export function EnterGiveaway({ id, entered }: { id: string; entered: boolean }) {
  const [done, setDone] = useState(entered);
  const [error, setError] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  if (done) return <Alert tone="success">Votre participation est enregistrée. Bonne chance !</Alert>;
  return (
    <div className="space-y-3">
      {error && <Alert tone="critical">{error}</Alert>}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-5 accent-ink" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>J&apos;ai lu et j&apos;accepte le <a className="underline" href="/legal/reglement-cadeaux" target="_blank">règlement</a>.</span>
      </label>
      <Button
        disabled={!agree}
        onClick={async () => {
          const r = await fetch(`/api/giveaways/${id}/enter`, { method: "POST" });
          if (r.ok) setDone(true);
          else setError((await r.json().catch(() => ({}))).message ?? "Participation impossible.");
        }}
      >
        Participer
      </Button>
    </div>
  );
}
