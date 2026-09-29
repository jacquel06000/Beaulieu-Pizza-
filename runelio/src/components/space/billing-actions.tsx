"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button } from "../ui";

export function CancelSubscription({ periodEnd }: { periodEnd: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  async function cancel() {
    setStep("loading");
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    if (!res.ok) {
      setStep("confirm");
      setError((await res.json().catch(() => ({}))).message ?? "Résiliation impossible, réessayez ou contactez-nous.");
      return;
    }
    setStep("done");
    router.refresh();
  }
  if (step === "done") return <Alert tone="success">Résiliation confirmée. Un e-mail de confirmation vous a été envoyé.</Alert>;
  return (
    <div id="resilier" className="scroll-mt-24">
      {step === "idle" ? (
        <Button variant="secondary" onClick={() => setStep("confirm")}>Résilier mon abonnement</Button>
      ) : (
        <div className="rounded-xl bg-paper p-4 ring-1 ring-line space-y-3">
          {error && <Alert tone="critical">{error}</Alert>}
          <p className="text-sm leading-relaxed">
            Confirmez-vous la résiliation ? Aucun nouveau prélèvement ne sera effectué. Vous conservez l&apos;accès jusqu&apos;au <strong>{periodEnd}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep("idle")}>Garder mon abonnement</Button>
            <Button variant="danger" onClick={cancel} disabled={step === "loading"}>Confirmer la résiliation</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReactivateSubscription() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {error && <Alert tone="critical">{error}</Alert>}
      <Button
        variant="secondary"
        onClick={async () => {
          const res = await fetch("/api/billing/reactivate", { method: "POST" });
          if (res.ok) router.refresh();
          else setError((await res.json().catch(() => ({}))).message ?? "Impossible pour le moment.");
        }}
      >
        Annuler la résiliation
      </Button>
    </div>
  );
}
