import type { Metadata } from "next";
import { AppShell } from "@/components/feeds/AppShell";
import { FeedDetail } from "@/components/feeds/FeedDetail";

export const metadata: Metadata = { title: "Feed" };

// One feed's detail (FR-FW-7), at /feed/?chain=…&id=…. The query string is read in the browser.
export default function FeedPage() {
  return (
    <AppShell>
      <FeedDetail />
    </AppShell>
  );
}
