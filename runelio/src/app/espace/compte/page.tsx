import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { user as userTable } from "@/db/schema";
import { ConsentForm, DataActions, PasswordForm, ProfileForm, ReminderForm, SignOutButton } from "@/components/space/account-forms";
import { PageHeader } from "@/components/ui";
import { getMarketingConsent } from "@/server/gdpr";
import { getReminderPreference } from "@/server/reminders";
import { requirePageUser } from "@/server/session";

export const metadata: Metadata = { title: "Compte" };

export default async function Page() {
  const u = await requirePageUser("/espace/compte");
  const db = getDb();
  const [row] = await db.select({ phone: userTable.phone }).from(userTable).where(eq(userTable.id, u.id));
  const marketing = await getMarketingConsent(db, u.id);
  const reminders = await getReminderPreference(db, u.id);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Paramètres" title="Mon compte" />
      <ProfileForm name={u.name} email={u.email} phone={row?.phone ?? ""} />
      <ReminderForm enabled={reminders} />
      <PasswordForm />
      <ConsentForm marketing={marketing} />
      <DataActions />
      <SignOutButton />
    </div>
  );
}
