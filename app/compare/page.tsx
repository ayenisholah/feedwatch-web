import { AppShell } from "@/components/feeds/AppShell";
import { Compare } from "@/components/feeds/Compare";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Compare chains",
  description:
    "The RedStone feeds pushed to Ethereum, Arbitrum and Base, side by side, with the spread between chains and the highest and lowest value marked.",
  path: "/compare/",
});

// The feeds on all three chains side by side (FR-FW-7).
export default function ComparePage() {
  return (
    <AppShell current="compare">
      <Compare />
    </AppShell>
  );
}
