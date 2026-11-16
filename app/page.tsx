import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ChartIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { ThemeToggle } from "@/components/ui/ThemeToggle/ThemeToggle";

// Placeholder until M3 (feat/overview, FR-FW-7). The data comes from the Rust API in M2.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <PageHeader
        title="Feedwatch"
        description="Freshness, missed updates and cross-chain spread for RedStone push price feeds."
        actions={<ThemeToggle />}
      />
      <EmptyState
        icon={<ChartIcon />}
        title="Feeds will appear here"
        description="The poller and API are being built. Ethereum, Arbitrum and Base feeds will show here with their status."
      />
    </main>
  );
}
