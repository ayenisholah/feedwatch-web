import type { Metadata } from "next";
import { AppShell } from "@/components/feeds/AppShell";
import { Incidents } from "@/components/feeds/Incidents";

export const metadata: Metadata = { title: "Incidents" };

// Incidents from the last 30 days (FR-FW-7).
export default function IncidentsPage() {
  return (
    <AppShell current="incidents">
      <Incidents />
    </AppShell>
  );
}
