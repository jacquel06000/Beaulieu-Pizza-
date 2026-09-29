import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { profileSchema } from "@/lib/validation";
import { assertSameOrigin, handle } from "@/server/api";
import { getProfile, saveProfile } from "@/server/plans";
import { requireApiUser } from "@/server/session";

export const GET = handle(async () => {
  const u = await requireApiUser();
  return NextResponse.json({ profile: await getProfile(getDb(), u.id) });
});

/** Inscription gratuite : enregistrer le questionnaire ne nécessite pas d'abonnement. */
export const PUT = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const input = profileSchema.parse(await req.json());
  await saveProfile(getDb(), u.id, input);
  return NextResponse.json({ ok: true });
});
