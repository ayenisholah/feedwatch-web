import { AppShell } from "@/components/feeds/AppShell";
import { Overview } from "@/components/feeds/Overview";

// The overview (FR-FW-7). Data is fetched in the browser; this page only lays it out.
export default function Home() {
  return (
    <AppShell current="overview">
      <Overview />
    </AppShell>
  );
}
