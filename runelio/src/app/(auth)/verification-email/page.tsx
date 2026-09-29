import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Confirmez votre adresse" };

export default function Page() {
  return (
    <AuthShell title="Confirmez votre adresse e-mail" subtitle="Pour protéger votre compte, cliquez sur le lien reçu par e-mail avant de continuer.">
      <p className="text-sm text-muted leading-relaxed">Vous ne trouvez pas l&apos;e-mail ? Vérifiez vos indésirables, puis demandez un nouveau lien depuis la page de connexion.</p>
      <ButtonLink href="/connexion" className="mt-5 w-full">Retour à la connexion</ButtonLink>
    </AuthShell>
  );
}
