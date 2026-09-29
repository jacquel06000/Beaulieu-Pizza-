import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdjustForm } from "@/components/space/adjust-form";
import type { Availability } from "@/components/space/availability-fields";
import { Card, PageHeader } from "@/components/ui";
import { canGeneratePlan } from "@/server/access";
import { requirePageUser } from "@/server/session";
import { loadSpaceState } from "@/server/views";

export const metadata: Metadata = { title: "Disponibilités" };

export default async function Page() {
  const user = await requirePageUser("/espace/disponibilites");
  const { sub, profile } = await loadSpaceState(user.id);
  if (!profile) redirect("/espace/questionnaire");
  if (!canGeneratePlan(sub)) redirect("/espace/programme");
  const initial: Availability = {
    availableDays: profile.availableDays,
    restDays: profile.restDays,
    timeSlots: profile.timeSlots as Availability["timeSlots"],
    longRunDay: profile.longRunDay,
    maxSessionMinutes: profile.maxSessionMinutes,
  };
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Réajuster" title="Mes disponibilités">
        Les séances passées et celles d&apos;aujourd&apos;hui sont conservées. Les semaines suivantes sont recalculées en tenant compte de vos nouvelles disponibilités et des séances réalisées ces 14 derniers jours.
      </PageHeader>
      <Card className="p-5 sm:p-8">
        <AdjustForm initial={initial} />
      </Card>
    </div>
  );
}
