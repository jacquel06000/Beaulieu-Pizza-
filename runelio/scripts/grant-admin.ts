/**
 * Donne le rôle administrateur à un compte existant (e-mail vérifié).
 *   npm run admin:grant -- vous@exemple.fr
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { user } from "../src/db/schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage : npm run admin:grant -- email@exemple.fr");
  const rows = await getDb().update(user).set({ role: "admin" }).where(eq(user.email, email)).returning({ id: user.id, verified: user.emailVerified });
  if (!rows.length) throw new Error("Aucun compte avec cette adresse.");
  if (!rows[0].verified) console.warn("Attention : l'adresse de ce compte n'est pas encore vérifiée.");
  console.info(`${email} est administrateur.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
