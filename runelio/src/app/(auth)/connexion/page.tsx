import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: "Connexion" };

export default async function Page({ searchParams }: PageProps<"/connexion">) {
  const { next } = await searchParams;
  const user = await getSessionUser().catch(() => null);
  if (user?.emailVerified) {
    const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/espace";
    redirect(target);
  }
  return (
    <AuthShell title="Bon retour !">
      <LoginForm next={typeof next === "string" ? next : null} />
    </AuthShell>
  );
}
