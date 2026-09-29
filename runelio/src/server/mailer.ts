import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

type Mail = { to: string; subject: string; text: string; html?: string };

let transport: Transporter | null | undefined;

function getTransport() {
  if (transport !== undefined) return transport;
  const e = env();
  transport = e.SMTP_HOST
    ? nodemailer.createTransport({
        host: e.SMTP_HOST,
        port: e.SMTP_PORT ?? 587,
        secure: e.SMTP_SECURE,
        auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
      })
    : null;
  return transport;
}

/**
 * Envoi d'e-mails transactionnels via SMTP (prestataire à définir).
 * Sans SMTP configuré : en développement, le message est affiché dans la console ;
 * en production, une erreur est levée pour ne pas perdre silencieusement un e-mail.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const t = getTransport();
  if (!t) {
    if (env().NODE_ENV === "production") {
      throw new Error("SMTP non configuré : impossible d'envoyer l'e-mail.");
    }
    console.info(`\n[mail:dev] À: ${mail.to}\nSujet: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  await t.sendMail({ from: env().MAIL_FROM, ...mail });
}

export function layoutEmail(title: string, body: string, cta?: { label: string; url: string }) {
  const text = `${title}\n\n${body}${cta ? `\n\n${cta.label} : ${cta.url}` : ""}\n\n— Runelio (runelio.fr)`;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f4f0;font-family:Arial,sans-serif;color:#14172b">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="font-weight:700;font-size:20px;color:#e2471b;margin:0 0 24px">Runelio</p>
<h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px">${esc(body).replace(/\n/g, "<br>")}</p>
${cta ? `<p><a href="${esc(cta.url)}" style="display:inline-block;background:#14172b;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">${esc(cta.label)}</a></p><p style="font-size:12px;color:#5b5f73;word-break:break-all">${esc(cta.url)}</p>` : ""}
<p style="font-size:12px;color:#5b5f73;margin-top:32px">Runelio — runelio.fr</p></div></body></html>`;
  return { text, html };
}
