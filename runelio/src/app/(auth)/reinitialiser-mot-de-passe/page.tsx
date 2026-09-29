import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/reinitialiser-mot-de-passe">) {
  const { token, error } = await searchParams;
  return (
    <AuthShell title="Choisir un nouveau mot de passe">
      <ResetForm token={!error && typeof token === "string" ? token : null} />
    </AuthShell>
  );
}
