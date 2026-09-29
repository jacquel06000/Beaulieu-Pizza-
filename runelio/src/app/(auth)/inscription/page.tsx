import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function Page() {
  return (
    <AuthShell title="Créer mon compte gratuit" subtitle="Préparez votre demande de programme. Aucun moyen de paiement n'est demandé à cette étape.">
      <SignupForm />
    </AuthShell>
  );
}
