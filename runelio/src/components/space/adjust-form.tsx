"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button } from "../ui";
import { AvailabilityFields, type Availability } from "./availability-fields";

export function AdjustForm({ initial }: { initial: Availability }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.availableDays.filter((d) => !value.restDays.includes(d)).length < 2) {
      setError("Choisissez au moins deux jours disponibles qui ne sont pas des jours de repos.");
      return;
    }
    setLoading(true);
    setError(null);
    const body = { ...value, longRunDay: value.longRunDay != null && value.availableDays.includes(value.longRunDay) && !value.restDays.includes(value.longRunDay) ? value.longRunDay : null };
    const res = await fetch("/api/plan/adjust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).message ?? "Réajustement impossible.");
      return;
    }
    router.push("/espace/programme");
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <Alert tone="critical">{error}</Alert>}
      <AvailabilityFields value={value} onChange={setValue} />
      <Button type="submit" disabled={loading}>{loading ? "Réajustement…" : "Réajuster les semaines à venir"}</Button>
    </form>
  );
}
