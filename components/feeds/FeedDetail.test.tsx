import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import eth from "@/e2e/fixtures/feed-ethereum-ETH.json";
import usual from "@/e2e/fixtures/feed-ethereum-USUAL.json";
import { axeViolations } from "@/test/axe";
import { stubApi } from "@/test/api-stub";
import { FeedDetail } from "./FeedDetail";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

function at(search: string) {
  window.history.replaceState(null, "", `/feed/${search}`);
}

describe("FeedDetail", () => {
  test("[FR-FW-7] shows the latest reading and both 24 h charts", async () => {
    at("?chain=ethereum&id=ETH");
    const fetchMock = stubApi({ "/api/feeds/ethereum/ETH": { body: eth } });
    const { container } = render(<FeedDetail />);
    expect(await screen.findByRole("heading", { level: 1, name: "ETH" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/feeds/ethereum/ETH", expect.anything());
    const latest = await screen.findByRole("region", { name: "Latest reading" });
    expect(within(latest).getByText("1,807.59")).toBeInTheDocument();
    expect(screen.getByText("Ethereum · RedStone push feed")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText(/vs reference: 0\.210% \(chainlink\)/)).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: "Price" })).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: "Age (hours)" })).toBeInTheDocument();
    expect(screen.getByText("heartbeat 1d", { selector: "text" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← All feeds" })).toHaveAttribute("href", "/");
    expect(await axeViolations(container)).toEqual([]);
  }, 30_000);

  test("[FR-FW-7] encodes IDs with a slash or plus", async () => {
    at("?chain=ethereum&id=WBTC%2FBTC");
    const fetchMock = stubApi({
      "/api/feeds/ethereum/WBTC%2FBTC": { body: { ...eth, latest: { ...eth.latest, feedId: "WBTC/BTC" } } },
    });
    render(<FeedDetail />);
    expect(await screen.findByRole("heading", { name: "WBTC/BTC" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/feeds/ethereum/WBTC%2FBTC", expect.anything());
  });

  test("[FR-FW-7] says when a feed couldn't be read and has no history", async () => {
    at("?chain=ethereum&id=USUAL");
    stubApi({ "/api/feeds/ethereum/USUAL": { body: usual } });
    const { container } = render(<FeedDetail />);
    expect(await screen.findByText("This feed couldn't be read this cycle")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("No readings in the last 24 hours")).toBeInTheDocument();
    expect(screen.getByText("No reference price for this asset", { exact: false })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  test("[FR-FW-7] shows history without a recent reading, and cron feeds' trigger", async () => {
    at("?chain=ethereum&id=ETH");
    stubApi({ "/api/feeds/ethereum/ETH": { body: { latest: null, series: eth.series } } });
    render(<FeedDetail />);
    expect(await screen.findByText("No reading in the last 15 minutes")).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: "Age (hours)" })).toHaveTextContent(
      "Time since the last on-chain update. It drops",
    );

    at("?chain=base&id=mzUSD_X");
    stubApi({
      "/api/feeds/base/mzUSD_X": {
        body: {
          latest: { ...eth.latest, chain: "base", deviationThresholdPct: null, referenceSource: null },
          // A point whose age wasn't recorded leaves a gap in the age chart.
          series: [{ t: 1_794_960_000, value: 1, ageS: null }],
        },
      },
    });
    render(<FeedDetail />);
    expect(await screen.findByText("None (updates on a daily schedule)")).toBeInTheDocument();
    expect(screen.getByText(/\(unknown source\)/)).toBeInTheDocument();
  });

  test("[FR-FW-7] a bad link or an unknown feed is not found; other errors can be retried", async () => {
    const fetchMock = stubApi({});
    at("?chain=solana&id=ETH");
    const { unmount } = render(<FeedDetail />);
    expect(await screen.findByText("Feed not found")).toBeInTheDocument();
    expect(screen.getByText("This link doesn't name a feed.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    unmount();

    at("?chain=base&id=NOPE");
    stubApi({ "/api/feeds/base/NOPE": { status: 404, body: { error: "no data" } } });
    const { unmount: unmount2 } = render(<FeedDetail />);
    expect(await screen.findByText("Feed not found")).toBeInTheDocument();
    expect(screen.getByText(/no data for “NOPE”/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all feeds" })).toHaveAttribute("href", "/");
    unmount2();

    at("?chain=base&id=ETH");
    stubApi({ "/api/feeds/base/ETH": { status: 503, body: { error: "down" } } });
    render(<FeedDetail />);
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "ETH" })).toBeInTheDocument();
  });
});
