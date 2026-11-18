import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import all from "@/e2e/fixtures/incidents-all.json";
import open from "@/e2e/fixtures/incidents-open.json";
import { axeViolations } from "@/test/axe";
import { stubApi } from "@/test/api-stub";
import { Incidents } from "./Incidents";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

const list = () => screen.findByRole("list", { name: "Incidents, newest first" });

describe("Incidents", () => {
  test("[FR-FW-7] shows open incidents by default, ongoing, with the feed linked", async () => {
    stubApi({ "/api/incidents": { body: open } });
    const { container } = render(<Incidents />);
    const items = within(await list()).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(within(items[0]!).getByText("Error")).toBeInTheDocument();
    expect(within(items[0]!).getByRole("link", { name: "USUAL" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/feed\/?\?chain=ethereum&id=USUAL$/),
    );
    expect(within(items[0]!).getByText(/^Ongoing for/)).toBeInTheDocument();
    expect(within(items[0]!).getByText("reverted: execution reverted")).toBeInTheDocument();
    expect(screen.getByText("1 open.")).toBeInTheDocument();
    expect(items[0]!.querySelector("time")).toHaveAttribute("dateTime", "2026-11-17T11:47:51.000Z");
    expect(await axeViolations(container)).toEqual([]);
  });

  test("[FR-FW-7] the last 30 days group the outage, and the choice is kept in the URL", async () => {
    const user = userEvent.setup();
    stubApi({ "/api/incidents?status=all": { body: all }, "/api/incidents": { body: open } });
    const { container } = render(<Incidents />);
    await list();
    await user.click(screen.getByRole("radio", { name: "Last 30 days" }));
    expect(window.location.search).toBe("?status=all");
    expect(await screen.findByText("146 incidents in the last 30 days, 1 still open.")).toBeInTheDocument();
    const items = within(await list())
      .getAllByRole("listitem")
      .filter((li) => li.parentElement?.getAttribute("aria-label"));
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("145 feeds at once")).toBeInTheDocument();
    expect(within(items[0]!).getByText(/Closed .* lasted 11h 20m/)).toBeInTheDocument();
    expect(within(items[0]!).getByText("Show the 145 feeds")).toBeInTheDocument();
    expect(within(items[0]!).getAllByRole("link")).toHaveLength(145);
    expect(await axeViolations(container)).toEqual([]);
  }, 30_000);

  test("[FR-FW-7] restores the filter from the URL; an incident older than the window has no start", async () => {
    window.history.replaceState(null, "", "/incidents/?status=all");
    const old = { ...open.incidents[0]!, id: "x", openedAt: null, closedAt: 1_794_960_000, detail: null };
    stubApi({ "/api/incidents?status=all": { body: { incidents: [old] } } });
    render(<Incidents />);
    const item = within(await list()).getByRole("listitem");
    expect(within(item).getByText(/^Opened more than 30 days ago · Closed/)).toBeInTheDocument();
  });

  test("[FR-FW-7] shows the empty states and errors", async () => {
    stubApi({ "/api/incidents": { body: { incidents: [] } } });
    const { unmount } = render(<Incidents />);
    expect(await screen.findByText("No open incidents")).toBeInTheDocument();
    unmount();

    window.history.replaceState(null, "", "/?status=all");
    stubApi({ "/api/incidents?status=all": { body: { incidents: [] } } });
    const { unmount: unmount2 } = render(<Incidents />);
    expect(await screen.findByText("No incidents in the last 30 days")).toBeInTheDocument();
    unmount2();

    stubApi({ "/api/incidents": { status: 503, body: { error: "down" } } });
    render(<Incidents />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Feed data is temporarily unavailable.");
  });
});
