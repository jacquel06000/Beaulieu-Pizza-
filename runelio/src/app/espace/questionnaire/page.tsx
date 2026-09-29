import type { Metadata } from "next";
import { addDays, todayIso } from "@/domain/dates";
import { Questionnaire, type QuestionnaireInitial } from "@/components/space/questionnaire";
import { Card, PageHeader } from "@/components/ui";
import { getDb } from "@/db";
import { getProfile } from "@/server/plans";
import { requirePageUser } from "@/server/session";

export const metadata: Metadata = { title: "Questionnaire" };

export default async function Page() {
  const user = await requirePageUser("/espace/questionnaire");
  const p = await getProfile(getDb(), user.id);
  const initial: QuestionnaireInitial | null =
    p && (p.goal === "5k" || p.goal === "10k" || p.goal === "half" || p.goal === "marathon")
      ? { ...p, goal: p.goal, timeSlots: p.timeSlots as QuestionnaireInitial["timeSlots"] }
      : null;
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Questionnaire" title="Parlez-nous de votre course">
        Environ 3 minutes. Seules les informations utiles à la construction du programme sont demandées ; vous pourrez les modifier à tout moment.
      </PageHeader>
      <Card className="p-5 sm:p-8">
        <Questionnaire initial={initial} minDate={addDays(todayIso(), 7)} />
      </Card>
    </div>
  );
}
