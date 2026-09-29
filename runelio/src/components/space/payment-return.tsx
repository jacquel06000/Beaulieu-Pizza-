"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert, ButtonLink } from "../ui";

type Status = {
  access: "none" | "active" | "canceling" | "past_due" | "ended";
  latestPayment: { status: string; failureMessage: string | null } | null;
  pendingCheckout: boolean;
  hasActivePlan: boolean;
};

/**
 * Page de retour après paiement : l'accès n'est jamais déduit de l'URL de retour.
 * On interroge le serveur, qui ne s'appuie que sur les webhooks signés de Whop.
 */
export function PaymentReturn() {
  const router = useRouter();
  const [state, setState] = useState<"waiting" | "generating" | "failed" | "timeout" | "error">("waiting");
  const [message, setMessage] = useState<string | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      tries.current++;
      const res = await fetch("/api/billing/status", { cache: "no-store" }).catch(() => null);
      if (stop) return;
      if (res?.ok) {
        const s = (await res.json()) as Status;
        if (s.access === "active" || s.access === "canceling") {
          // Un programme existe déjà (retour sur la page, réabonnement) : on ne l'écrase pas.
          if (s.hasActivePlan) {
            router.replace("/espace/programme");
            router.refresh();
            return;
          }
          setState("generating");
          const g = await fetch("/api/plan/generate", { method: "POST" });
          if (g.ok) {
            router.replace("/espace/programme");
            router.refresh();
          } else {
            setState("error");
            setMessage((await g.json().catch(() => ({}))).message ?? null);
          }
          return;
        }
        if (s.latestPayment?.status === "failed" || s.latestPayment?.status === "canceled") {
          setState("failed");
          setMessage(s.latestPayment.failureMessage);
          return;
        }
      }
      if (tries.current >= 40) {
        setState("timeout");
        return;
      }
      timer = setTimeout(poll, 3000);
    }
    poll();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [router]);

  if (state === "waiting" || state === "generating") {
    return (
      <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
        <span aria-hidden className="size-12 animate-spin rounded-full border-4 border-line border-t-brand" />
        <p className="mt-5 font-semibold">{state === "waiting" ? "Confirmation du paiement en cours…" : "Paiement confirmé ! Génération de votre programme…"}</p>
        <p className="mt-2 text-sm text-muted">Cela prend généralement quelques secondes. Vous pouvez laisser cette page ouverte.</p>
      </div>
    );
  }
  if (state === "failed") {
    return (
      <Alert tone="critical" title="Le paiement n'a pas abouti">
        {message ?? "Le paiement a été refusé ou annulé."} Aucun programme n&apos;a été généré.
        <div className="mt-3"><ButtonLink href="/espace/abonnement" variant="secondary">Réessayer</ButtonLink></div>
      </Alert>
    );
  }
  if (state === "timeout") {
    return (
      <Alert tone="warning" title="Paiement non confirmé pour l'instant">
        Si vous avez abandonné le paiement, rien n&apos;a été facturé. Si vous l&apos;avez validé, il est peut-être encore en cours de traitement (certains moyens de paiement prennent plus de temps) : votre accès s&apos;activera automatiquement dès sa confirmation.
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink href="/espace" variant="secondary">Retour à mon espace</ButtonLink>
          <ButtonLink href="/espace/abonnement" variant="ghost">Recommencer le paiement</ButtonLink>
        </div>
      </Alert>
    );
  }
  return <Alert tone="critical">{message ?? "Une erreur est survenue."}</Alert>;
}
