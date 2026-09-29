import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { getMarketingConsent, setMarketingConsent } from "@/server/gdpr";
import { requireApiUser } from "@/server/session";

export const GET = handle(async () => {
  const u = await requireApiUser();
  return NextResponse.json({ marketingEmail: await getMarketingConsent(getDb(), u.id) });
});

export const PUT = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const { marketingEmail } = z.object({ marketingEmail: z.boolean() }).parse(await req.json());
  await setMarketingConsent(getDb(), u.id, marketingEmail);
  return NextResponse.json({ ok: true });
});
