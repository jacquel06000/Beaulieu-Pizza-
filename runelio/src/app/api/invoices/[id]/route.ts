import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invoice } from "@/db/schema";
import { formatEuros, PUBLISHER } from "@/lib/config";
import { env } from "@/lib/env";
import { handle } from "@/server/api";
import { notFound } from "@/server/errors";
import { requireApiUser } from "@/server/session";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Facture imprimable (HTML). Accessible uniquement au titulaire. */
export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/invoices/[id]">) => {
  if (!env().INVOICES_ENABLED) throw notFound();
  const u = await requireApiUser();
  const { id } = await ctx.params;
  const [inv] = await getDb().select().from(invoice).where(and(eq(invoice.id, id), eq(invoice.userId, u.id)));
  if (!inv) throw notFound("Facture introuvable.");
  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(inv.issuedAt);
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${esc(inv.number)}</title>
<style>body{font-family:Arial,sans-serif;color:#14172b;max-width:720px;margin:40px auto;padding:0 20px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}.r{text-align:right}small{color:#555}@media print{button{display:none}}</style></head><body>
<button onclick="print()">Imprimer / PDF</button>
<h1>Facture n° ${esc(inv.number)}</h1><p>Date d'émission : ${date}</p>
<p><strong>${esc(PUBLISHER.name)}</strong> — ${esc(PUBLISHER.legalForm)}<br>${esc(PUBLISHER.address)}<br>SIRET ${esc(PUBLISHER.siret)}<br>${esc(PUBLISHER.email)}</p>
<p><strong>Client</strong><br>${esc(inv.customerName)}<br>${esc(inv.customerEmail)}</p>
<table><thead><tr><th>Désignation</th><th class="r">Montant</th></tr></thead><tbody>
<tr><td>${esc(inv.description)}</td><td class="r">${formatEuros(inv.amountCents)}</td></tr>
<tr><th>Total à payer</th><th class="r">${formatEuros(inv.amountCents)}</th></tr></tbody></table>
<p>${esc(inv.vatMention)}</p><p><small>Facture acquittée — paiement reçu via Whop. [À COMPLÉTER : autres mentions obligatoires après vérification.]</small></p>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
});
