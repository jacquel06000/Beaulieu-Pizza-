import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import { forbidden, unauthorized } from "./errors";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  phone?: string | null;
  role?: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const s = await getAuth().api.getSession({ headers: await headers() });
  return (s?.user as SessionUser | undefined) ?? null;
}

/** Pour les pages : redirige vers la connexion si besoin. */
export async function requirePageUser(next = "/espace"): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  if (!u.emailVerified) redirect("/verification-email");
  return u;
}

export async function requirePageAdmin(): Promise<SessionUser> {
  const u = await requirePageUser("/admin");
  if (u.role !== "admin") redirect("/espace");
  return u;
}

/** Pour les API : lève une erreur HTTP. */
export async function requireApiUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw unauthorized();
  if (!u.emailVerified) throw forbidden("Adresse e-mail non confirmée.");
  return u;
}

export async function requireApiAdmin(): Promise<SessionUser> {
  const u = await requireApiUser();
  if (u.role !== "admin") throw forbidden();
  return u;
}
