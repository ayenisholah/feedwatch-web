import { AppShell } from "@/components/feeds/AppShell";
import { Incidents } from "@/components/feeds/Incidents";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Incidents",
  description:
    "When a RedStone feed went stale, missed an update or couldn’t be read, why, and when it recovered: open incidents and the last 30 days.",
  path: "/incidents/",
});

// Incidents from the last 30 days (FR-FW-7).
export default function IncidentsPage() {
  return (
    <AppShell current="incidents">
      <Incidents />
    </AppShell>
  );
}
