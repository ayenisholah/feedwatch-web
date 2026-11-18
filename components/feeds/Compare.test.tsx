import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import compare from "@/e2e/fixtures/compare.json";
import { axeViolations } from "@/test/axe";
import { stubApi } from "@/test/api-stub";
import { Compare } from "./Compare";

afterEach(() => vi.unstubAllGlobals());

/** The fixture with one wide spread, one missing chain and one feed in trouble. */
function edited() {
  const feeds = structuredClone(compare.feeds) as typeof compare.feeds;
  feeds[0] = { ...feeds[0]!, spreadPct: 0.62 };
  const eth = feeds.find((f) => f.feedId === "ETH")!;
  eth.chains.base = { ...eth.chains.base, status: "stale" };
  const usdc = feeds.find((f) => f.feedId === "USDC")! as { chains: Record<string, unknown> };
  delete usdc.chains.arbitrum;
  return { ...compare, feeds };
}

describe("Compare", () => {
  test("[FR-FW-7] lists the feeds on all three chains, widest spread first, as a table and as cards", async () => {
    stubApi({ "/api/compare": { body: compare } });
    const { container } = render(<Compare />);
    const table = await screen.findByRole("table", { name: "Feeds on all three chains, widest spread first" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getByRole("rowheader").textContent)).toEqual([
      "XVS",
      "ETH",
      "wstETH",
      "cbBTC",
      "BTC",
      "USDC",
      "thBILL_FUNDAMENTAL",
    ]);
    // XVS ties for lowest on Ethereum and Base.
    expect(within(rows[0]!).getAllByText("lowest")).toHaveLength(2);
    expect(within(rows[0]!).getAllByText("highest")).toHaveLength(1);
    expect(within(rows[0]!).getByText("0.381%")).toBeInTheDocument();
    // thBILL is identical everywhere: nothing marked.
    expect(within(rows[6]!).queryByText(/highest|lowest/)).toBeNull();
    expect(within(rows[1]!).getByRole("link", { name: "ETH" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/feed\/?\?chain=ethereum&id=ETH$/),
    );

    const cards = screen.getByRole("list", { name: "Feeds on all three chains" });
    expect(within(cards).getAllByRole("listitem")).toHaveLength(7);
    expect(await axeViolations(container)).toEqual([]);
  });

  test("[FR-FW-7] highlights a wide spread, a missing chain and a feed in trouble", async () => {
    stubApi({ "/api/compare": { body: edited() } });
    render(<Compare />);
    const table = await screen.findByRole("table");
    const wide = within(table).getByText("0.620%", { exact: false });
    expect(wide).toHaveAttribute("title", "Above 0.5%");
    expect(wide).toHaveTextContent("0.620% , above 0.5%");
    expect(within(table).getByText("Not on this chain")).toBeInTheDocument();
    expect(within(table).getByText("Stale")).toBeInTheDocument();
  });

  test("[FR-FW-7] shows the empty and error states", async () => {
    stubApi({ "/api/compare": { body: { lastPollAt: null, feeds: [] } } });
    const { unmount } = render(<Compare />);
    expect(await screen.findByText("No feed is present on all three chains right now")).toBeInTheDocument();
    unmount();

    stubApi({ "/api/compare": { status: 503, body: { error: "down" } } });
    render(<Compare />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Feed data is temporarily unavailable.");
  });
});
