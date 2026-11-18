import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { fixtures, stubApi } from "@/test/api-stub";
import { AgeBar } from "./AgeBar";
import { AppShell, HealthPill } from "./AppShell";
import { DataState } from "./DataState";
import { FeedTable } from "./FeedTable";
import { StatusBadge } from "./StatusBadge";

afterEach(() => vi.unstubAllGlobals());

describe("AgeBar", () => {
  test("[FR-FW-7] is a labelled meter that turns amber past the heartbeat and red past the grace", () => {
    const { rerender } = render(<AgeBar ageS={43_200} heartbeatS={86_400} />);
    const meter = screen.getByRole("meter", { name: "Age against heartbeat" });
    expect(meter).toHaveAttribute("aria-valuenow", "50");
    expect(meter).toHaveAttribute("aria-valuetext", "50% of the heartbeat: 12h of 1d");
    expect(meter.firstElementChild).toHaveClass("bg-success");

    rerender(<AgeBar ageS={90_000} heartbeatS={86_400} />);
    expect(screen.getByRole("meter").firstElementChild).toHaveClass("bg-warning");
    rerender(<AgeBar ageS={200_000} heartbeatS={86_400} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "110");
    expect(screen.getByRole("meter").firstElementChild).toHaveClass("bg-danger");
    expect(screen.getByText("231%")).toBeInTheDocument();

    rerender(<AgeBar ageS={null} heartbeatS={86_400} />);
    expect(screen.queryByRole("meter")).toBeNull();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("StatusBadge and FeedTable", () => {
  test("[FR-FW-7] renders each feed's row, with dashes for a feed that couldn't be read", async () => {
    const { container } = render(
      <FeedTable
        caption="2 feeds"
        nowMs={1_794_960_300_000}
        feeds={[
          { chain: "ethereum", feedId: "USUAL", status: "error", heartbeatS: 86_400 },
          {
            chain: "base",
            feedId: "ETH",
            status: "ok",
            value: 3120.5,
            updatedAt: 1_794_960_000,
            ageS: 300,
            heartbeatS: 86_400,
            referenceDeviationPct: 0.0123,
          },
        ]}
      />,
    );
    expect(screen.getByRole("region", { name: "2 feeds" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("3,120.50")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();
    expect(screen.getByText("0.012%")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(await axeViolations(container)).toEqual([]);
    render(<StatusBadge status="drift" className="x" />);
    expect(screen.getByText("Drift")).toHaveClass("x");
  });
});

describe("DataState", () => {
  test("[FR-FW-7] keeps earlier data visible under a refresh warning", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(
      <DataState
        result={{
          state: "error",
          error: { status: 429, message: "Too many requests." },
          data: "old",
          refreshedAt: 1_000,
        }}
        retry={retry}
        nowMs={61_000}
        empty={null}
      >
        {(data) => <p>data: {data}</p>}
      </DataState>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Too many requests. Showing data from 1m ago.");
    expect(screen.getByText("data: old")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  test("[FR-FW-7] falls back to now when an error has data but no refresh time", () => {
    render(
      <DataState
        result={{ state: "error", error: { status: 0, message: "Offline." }, data: 1 }}
        retry={vi.fn()}
        nowMs={5_000}
        empty={null}
      >
        {(data) => <p>value {data}</p>}
      </DataState>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Offline. Showing data from just now.");
  });
});

describe("AppShell and HealthPill", () => {
  test("[FR-FW-7] marks the current page and shows a live poll", async () => {
    stubApi({ "/api/health": { body: { ...fixtures.health, lastPollAt: Math.floor(Date.now() / 1000) } } });
    const { container } = render(
      <AppShell current="overview">
        <h1>Page</h1>
      </AppShell>,
    );
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Grafana" })).toHaveAttribute("href", "/grafana/d/feedwatch-feeds");
    expect(screen.getByRole("main")).toHaveTextContent("Page");
    expect(await screen.findByText(/Live · last poll just now/)).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  test("[FR-FW-7] a page outside the nav marks no link as current", () => {
    stubApi({ "/api/health": "hang" });
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  test("[FR-FW-7] reports a delayed poller and an unreachable API", async () => {
    stubApi({ "/api/health": { body: { status: "degraded", influx: "ok", lastPollAt: null } } });
    const { unmount } = render(<HealthPill />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking status…");
    expect(await screen.findByText("Delayed · last poll —")).toBeInTheDocument();
    unmount();

    stubApi({ "/api/health": { status: 503, body: { error: "x" } } });
    render(<HealthPill />);
    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
  });
});
