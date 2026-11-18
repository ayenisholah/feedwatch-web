import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { LineChart } from "./LineChart";

const points = [
  { t: 1_794_960_000, y: 100 },
  { t: 1_794_960_300, y: null },
  { t: 1_794_960_600, y: 110 },
];
const format = (v: number) => `$${v}`;

afterEach(() => vi.unstubAllGlobals());

describe("LineChart", () => {
  test("[FR-FW-7] draws a captioned chart with a table view, and passes axe", async () => {
    const { container } = render(
      <LineChart
        title="Value"
        summary="Last 24 hours."
        points={points}
        format={format}
        reference={{ value: 120, label: "heartbeat 1d" }}
      />,
    );
    expect(screen.getByRole("figure", { name: "Value" })).toBeInTheDocument();
    expect(screen.getByText("heartbeat 1d")).toBeInTheDocument();
    expect(container.querySelector("path")?.getAttribute("d")).toMatch(/^M[\d.]+,[\d.]+M[\d.]+,[\d.]+$/);
    expect(screen.getByText("Show data (3 points)")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  test("[FR-FW-7] reads values by keyboard: arrows, Home, End and Escape", async () => {
    const user = userEvent.setup();
    render(<LineChart title="Value" summary="s" points={points} format={format} />);
    const chart = screen.getByRole("group", { name: "Value chart. Use the arrow keys to read values." });
    chart.focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("2026-11-18 00:10 UTC: $110")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("2026-11-18 00:05 UTC: —")).toBeInTheDocument();
    await user.keyboard("{Home}{ArrowLeft}");
    expect(screen.getByText("2026-11-18 00:00 UTC: $100")).toBeInTheDocument();
    await user.keyboard("{End}{ArrowRight}");
    expect(screen.getByText("2026-11-18 00:10 UTC: $110")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText(/UTC: /)).toBeNull();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("2026-11-18 00:00 UTC: $100")).toBeInTheDocument();
    await user.keyboard("a");
    await user.tab();
    expect(screen.queryByText(/UTC: /)).toBeNull();
  });

  test("[FR-FW-7] the crosshair follows the pointer to the nearest point", () => {
    render(<LineChart title="Value" summary="s" points={points} format={format} />);
    const hit = screen.getByTestId("chart-hit-area");
    hit.getBoundingClientRect = () => ({ left: 0, width: 600 }) as DOMRect;
    fireEvent.pointerMove(hit, { clientX: 590 });
    expect(screen.getByText("2026-11-18 00:10 UTC: $110")).toBeInTheDocument();
    fireEvent.pointerMove(hit, { clientX: 10 });
    expect(screen.getByText("2026-11-18 00:00 UTC: $100")).toBeInTheDocument();
    hit.getBoundingClientRect = () => ({ left: 0, width: 0 }) as DOMRect;
    fireEvent.pointerMove(hit, { clientX: 0 });
    fireEvent.pointerLeave(hit);
    expect(screen.queryByText(/UTC: /)).toBeNull();
  });

  test("[FR-FW-7] follows its container's width, and draws nothing without values", () => {
    let callback: ResizeObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const { container, unmount } = render(<LineChart title="Value" summary="s" points={points} format={format} />);
    act(() => callback([{ contentRect: { width: 0 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(container.querySelector("svg")).toHaveAttribute("width", "640");
    act(() => callback([{ contentRect: { width: 360 } } as ResizeObserverEntry], {} as ResizeObserver));
    expect(container.querySelector("svg")).toHaveAttribute("width", "360");
    unmount();
    expect(disconnect).toHaveBeenCalled();

    const { container: empty } = render(
      <LineChart title="V" summary="s" points={[{ t: 1, y: null }]} format={format} />,
    );
    expect(empty).toBeEmptyDOMElement();
    const { container: none } = render(<LineChart title="V" summary="s" points={[]} format={format} />);
    expect(none).toBeEmptyDOMElement();
  });
});
