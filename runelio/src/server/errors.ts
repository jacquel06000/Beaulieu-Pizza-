export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
export const unauthorized = () => new HttpError(401, "unauthorized", "Connexion requise.");
export const forbidden = (msg = "Accès refusé.") => new HttpError(403, "forbidden", msg);
export const paymentRequired = () =>
  new HttpError(402, "subscription_required", "Un abonnement actif est nécessaire pour générer ou consulter un programme.");
export const notFound = (msg = "Introuvable.") => new HttpError(404, "not_found", msg);
export const badRequest = (msg: string) => new HttpError(400, "bad_request", msg);
export const tooMany = () => new HttpError(429, "rate_limited", "Trop de tentatives. Réessayez dans quelques minutes.");
