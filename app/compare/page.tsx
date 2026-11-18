import type { Metadata } from "next";
import { AppShell } from "@/components/feeds/AppShell";
import { Compare } from "@/components/feeds/Compare";

export const metadata: Metadata = { title: "Compare chains" };

// The feeds on all three chains side by side (FR-FW-7).
export default function ComparePage() {
  return (
    <AppShell current="compare">
      <Compare />
    </AppShell>
  );
}
