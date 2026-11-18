import { AppShell } from "@/components/feeds/AppShell";
import { FeedDetail } from "@/components/feeds/FeedDetail";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Feed detail",
  description: "One RedStone feed’s latest reading, its age against the heartbeat, and 24 hours of value and age.",
  path: "/feed/",
  // Its content depends on the query string, and /feed/ alone has nothing to index.
  noindex: true,
});

// One feed's detail (FR-FW-7), at /feed/?chain=…&id=…. The query string is read in the browser.
export default function FeedPage() {
  return (
    <AppShell>
      <FeedDetail />
    </AppShell>
  );
}
