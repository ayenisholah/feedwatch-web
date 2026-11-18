import { AppShell } from "@/components/feeds/AppShell";
import { Overview } from "@/components/feeds/Overview";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "RedStone feed health",
  description:
    "Every RedStone push price feed on Ethereum, Arbitrum and Base: status, value, age against its heartbeat and distance from a reference price, checked each minute.",
  path: "/",
  home: true,
});

// The overview (FR-FW-7). Data is fetched in the browser; this page only lays it out.
export default function Home() {
  return (
    <AppShell current="overview">
      <Overview />
    </AppShell>
  );
}
