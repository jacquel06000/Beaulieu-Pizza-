import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function Page() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Indiquez votre adresse : nous vous enverrons un lien sécurisé.">
      <ForgotForm />
    </AuthShell>
  );
}
