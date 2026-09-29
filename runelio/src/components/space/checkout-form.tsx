"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRICING } from "@/lib/config";
import { Alert, Button } from "../ui";

export function CheckoutForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [immediate, setImmediate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptTerms: terms, immediateExecution: immediate }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(j.message ?? "Impossible d'ouvrir le paiement.");
      return;
    }
    if (j.alreadySubscribed) {
      router.push("/espace/recapitulatif");
      return;
    }
    // Redirection vers la page de paiement hébergée par Whop.
    window.location.href = j.purchaseUrl;
  }

  if (!configured) {
    return <Alert tone="warning" title="Paiement indisponible">Le paiement en ligne n&apos;est pas encore activé sur ce site. Aucun abonnement ne peut être souscrit pour le moment.</Alert>;
  }

  return (
    <div className="space-y-4">
      {error && <Alert tone="critical">{error}</Alert>}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-ink" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>
          J&apos;ai lu et j&apos;accepte les <Link href="/legal/cgu-cgv" target="_blank" className="underline">conditions générales de vente</Link>, notamment le renouvellement automatique tous les {PRICING.billingPeriodDays} jours et les modalités de résiliation.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-ink" checked={immediate} onChange={(e) => setImmediate(e.target.checked)} />
        <span>
          Je demande à accéder au service et à recevoir mon programme dès la confirmation du paiement, avant la fin du délai de rétractation de 14 jours, et je reconnais que je perds mon droit de rétractation pour le programme ainsi fourni.{" "}
          <span className="todo">[À VALIDER : formulation juridique]</span>
        </span>
      </label>
      <Button variant="brand" className="w-full min-h-12 text-base" disabled={!terms || !immediate || loading} onClick={pay}>
        {loading ? "Ouverture du paiement sécurisé…" : `S'abonner — ${PRICING.label} / mois`}
      </Button>
      <p className="text-xs text-muted text-center">Vous serez redirigé vers Whop, notre prestataire de paiement. Le bouton de validation finale se trouve sur sa page.</p>
    </div>
  );
}
