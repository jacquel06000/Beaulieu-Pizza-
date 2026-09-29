"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button } from "../ui";

/** « Générer mon programme » : génère si l'abonnement est confirmé côté serveur, sinon présente l'offre. */
export function GenerateButton({ subscribed, hasPlan }: { subscribed: boolean; hasPlan: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  async function go() {
    if (!subscribed) {
      router.push("/espace/abonnement");
      return;
    }
    if (hasPlan && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/plan/generate", { method: "POST" });
    if (res.status === 402) {
      router.push("/espace/abonnement");
      return;
    }
    if (!res.ok) {
      setLoading(false);
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Génération impossible.");
      return;
    }
    router.push("/espace/programme");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="critical">{error}</Alert>}
      {confirmReplace && <Alert tone="warning">Un programme est déjà actif. En générer un nouveau l&apos;archivera (le suivi des séances passées sera conservé dans l&apos;export de vos données). Cliquez à nouveau pour confirmer.</Alert>}
      <Button variant="brand" className="w-full sm:w-auto px-8 min-h-12 text-base" onClick={go} disabled={loading}>
        {loading ? "Génération en cours…" : confirmReplace ? "Confirmer et générer" : "Générer mon programme"}
      </Button>
    </div>
  );
}
