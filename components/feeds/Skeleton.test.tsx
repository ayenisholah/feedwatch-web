import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { DataState } from "./DataState";
import { Logo, LogoMark } from "./Logo";
import { Bone, CompareSkeleton, DetailSkeleton, IncidentsSkeleton, OverviewSkeleton } from "./Skeleton";

describe("loading skeletons", () => {
  test("[FR-FW-7] each page's skeleton is decorative, inside an announced busy status", async () => {
    for (const skeleton of [
      <OverviewSkeleton key="o" />,
      <DetailSkeleton key="d" />,
      <CompareSkeleton key="c" />,
      <IncidentsSkeleton key="i" />,
    ]) {
      const { container, unmount } = render(
        <DataState result={{ state: "loading" }} retry={vi.fn()} nowMs={0} empty={null} loading={skeleton}>
          {() => null}
        </DataState>,
      );
      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-busy", "true");
      expect(status).toHaveTextContent("Loading feed data…");
      const bones = container.querySelectorAll("[aria-hidden='true']");
      expect(bones.length).toBeGreaterThan(3);
      // The pulse stops for people who prefer reduced motion.
      expect(bones[0]).toHaveClass("animate-pulse", "motion-reduce:animate-none");
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });

  test("[FR-FW-7] without a page skeleton, a plain placeholder", () => {
    const { container } = render(
      <DataState result={{ state: "loading" }} retry={vi.fn()} nowMs={0} empty={null}>
        {() => null}
      </DataState>,
    );
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(1);
    render(<Bone className="h-4" />);
  });
});

describe("Logo", () => {
  test("[FR-FW-7] the mark is decorative and the wordmark names the site", () => {
    const { container } = render(<Logo className="x" />);
    expect(screen.getByText("Feedwatch")).toHaveClass("x");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    const { container: big } = render(<LogoMark size={64} className="y" />);
    expect(big.querySelector("svg")).toHaveAttribute("width", "64");
    expect(big.querySelector("svg")).toHaveClass("y");
  });
});
