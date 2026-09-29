import type { ReactNode } from "react";
import { Container } from "../ui";

export function Todo({ children }: { children: ReactNode }) {
  return <mark className="todo">[À COMPLÉTER : {children}]</mark>;
}
export function Verify({ children }: { children: ReactNode }) {
  return <mark className="todo">[À VÉRIFIER : {children}]</mark>;
}

export function LegalPage({ title, updated, children, draft = true }: { title: string; updated: string; children: ReactNode; draft?: boolean }) {
  return (
    <Container className="py-12 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : {updated}</p>
      {draft && (
        <p className="mt-4 rounded-xl bg-warn-soft p-4 text-sm text-warn">
          <strong>Projet de document.</strong> Ce texte doit être complété et relu (idéalement par un professionnel du droit) avant la mise en ligne commerciale du service.
        </p>
      )}
      <article className="prose-legal mt-8">{children}</article>
    </Container>
  );
}
