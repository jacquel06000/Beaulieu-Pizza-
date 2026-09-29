import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";
import { HttpError } from "./errors";

/** Enveloppe commune des routes API : erreurs normalisées, pas de fuite de détails internes. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
      }
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: "invalid_input", message: e.issues[0]?.message ?? "Données invalides.", issues: e.issues },
          { status: 400 },
        );
      }
      console.error(e);
      return NextResponse.json({ error: "server_error", message: "Une erreur est survenue." }, { status: 500 });
    }
  };
}

/** Vérifie l'origine des requêtes mutantes (protection CSRF complémentaire aux cookies SameSite). */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const app = env().NEXT_PUBLIC_APP_URL;
  if (!origin || !app || new URL(origin).origin !== new URL(app).origin) {
    throw new HttpError(403, "bad_origin", "Origine de la requête non autorisée.");
  }
}
