import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { payment } from "@/db/schema";
import { handle } from "@/server/api";
import { accessState } from "@/server/access";
import { getCurrentSubscription, hasPendingCheckout } from "@/server/billing";
import { requireApiUser } from "@/server/session";

export const GET = handle(async () => {
  const u = await requireApiUser();
  const db = getDb();
  const sub = await getCurrentSubscription(db, u.id);
  const [latest] = await db.select().from(payment).where(eq(payment.userId, u.id)).orderBy(desc(payment.updatedAt)).limit(1);
  return NextResponse.json(
    {
      access: accessState(sub),
      subscription: sub && { status: sub.status, cancelAtPeriodEnd: sub.cancelAtPeriodEnd, currentPeriodEnd: sub.currentPeriodEnd },
      latestPayment: latest && { status: latest.status, failureMessage: latest.failureMessage, updatedAt: latest.updatedAt },
      pendingCheckout: await hasPendingCheckout(db, u.id),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
