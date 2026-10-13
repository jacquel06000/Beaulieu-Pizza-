"use client";
import { useState } from "react";
import { Alert, Button, Card } from "../ui";

type Check = { label: string; ok: boolean; value: unknown };
export function StripeCheck() {
  const [data, setData] = useState<{ configured: boolean; mode?: string; checks?: Check[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card>
      <h2 className="text-lg font-bold">Configuration Stripe</h2>
      <p className="mt-1 text-sm text-muted">Compare le prix Stripe configuré avec le prix affiché sur le site (19,99 € par mois, sans taxe ajoutée).</p>
      <Button
        variant="secondary"
        className="mt-4"
        onClick={async () => {
          setError(null);
          const r = await fetch("/api/admin/stripe-check");
          if (r.ok) setData(await r.json());
          else setError((await r.json().catch(() => ({}))).message ?? "Erreur lors de l'appel à Stripe.");
        }}
      >
        Vérifier maintenant
      </Button>
      {error && <Alert tone="critical" className="mt-4">{error}</Alert>}
      {data && !data.configured && <Alert tone="warning" className="mt-4">Variables STRIPE_* manquantes.</Alert>}
      {data?.checks && (
        <ul className="mt-4 space-y-1 text-sm">
          <li className="text-muted">Clés Stripe : mode {data.mode}</li>
          {data.checks.map((c) => (
            <li key={c.label} className={c.ok ? "text-mint" : "text-danger font-semibold"}>
              {c.ok ? "✓" : "✗"} {c.label} <span className="text-muted font-normal">({String(c.value)})</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
