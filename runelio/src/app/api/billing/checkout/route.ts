import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { env, whopConfigured } from "@/lib/env";
import { assertSameOrigin, handle } from "@/server/api";
import { startCheckout } from "@/server/billing";
import { HttpError } from "@/server/errors";
import { requireApiUser } from "@/server/session";
import { whopGateway } from "@/server/whop";

const body = z.object({ acceptTerms: z.boolean(), immediateExecution: z.boolean() });

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  if (!whopConfigured()) throw new HttpError(503, "billing_not_configured", "Le paiement n'est pas encore configuré.");
  const input = body.parse(await req.json());
  const result = await startCheckout(getDb(), whopGateway, u, { ...input, appUrl: env().NEXT_PUBLIC_APP_URL });
  return NextResponse.json(result);
});
