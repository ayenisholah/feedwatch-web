import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { fixtures, stubApi } from "@/test/api-stub";
import { Overview } from "./Overview";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

const rows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);

describe("Overview", () => {
  test("[FR-FW-7] shows a loading state, then every feed with the worst first", async () => {
    stubApi({ "/api/feeds": { body: fixtures.feeds } });
    const { container } = render(<Overview />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading feed data…");

    expect(await screen.findByRole("table", { name: "146 feeds on all chains" })).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "Summary" });
    expect(within(summary).getByText("Feeds monitored").nextSibling).toHaveTextContent("146");
    expect(within(summary).getByText("Need attention").nextSibling).toHaveTextContent("1");
    // USUAL can't be read: it sorts first, as an error with no value.
    const first = rows()[0]!;
    expect(within(first).getByRole("link", { name: "USUAL" })).toHaveAttribute(
      "href",
      // next/link applies trailingSlash from next.config only in the real build.
      expect.stringMatching(/^\/feed\/?\?chain=ethereum&id=USUAL$/),
    );
    expect(within(first).getByText("Error")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  }, 30_000); // axe over 146 rows is slow in jsdom

  test("[FR-FW-7] filters by chain and issues, keeping the choice in the URL", async () => {
    const user = userEvent.setup();
    stubApi({ "/api/feeds": { body: fixtures.feeds } });
    render(<Overview />);
    await screen.findByRole("table");

    await user.click(screen.getByRole("radio", { name: "Base" }));
    expect(screen.getByRole("table", { name: "30 feeds on Base" })).toBeInTheDocument();
    expect(window.location.search).toBe("?chain=base");

    await user.click(screen.getByRole("radio", { name: "Issues (1)" }));
    expect(screen.getByText("No feeds match")).toBeInTheDocument();
    expect(screen.getByText("Nothing on Base matches these filters.")).toBeInTheDocument();
    expect(window.location.search).toBe("?chain=base&view=issues");

    await user.click(screen.getByRole("radio", { name: "All chains" }));
    expect(screen.getByRole("table", { name: "1 feeds on all chains" })).toBeInTheDocument();
  });

  test("[FR-FW-7] restores filters from the URL and searches feed IDs", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?chain=arbitrum");
    stubApi({ "/api/feeds": { body: fixtures.feeds } });
    render(<Overview />);
    expect(await screen.findByRole("table", { name: "21 feeds on Arbitrum" })).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Search feeds" }), "eth");
    for (const row of rows()) expect(row.textContent?.toLowerCase()).toContain("eth");
  });

  test("[FR-FW-7] shows the empty state", async () => {
    stubApi({ "/api/feeds": { body: { lastPollAt: null, feeds: [] } } });
    const { container } = render(<Overview />);
    expect(await screen.findByText("No feeds reported in the last 15 minutes")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  test("[FR-FW-7] shows an error with Try again, which reloads", async () => {
    const user = userEvent.setup();
    const fetchMock = stubApi({ "/api/feeds": { status: 503, body: { error: "down" } } });
    const { container } = render(<Overview />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load feed data");
    expect(alert).toHaveTextContent("Feed data is temporarily unavailable.");
    expect(await axeViolations(container)).toEqual([]);

    stubApi({ "/api/feeds": { body: fixtures.feeds } });
    await user.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
