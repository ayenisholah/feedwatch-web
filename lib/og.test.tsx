import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { OG_PAGES, OG_SIZE, OgCard, OgMark } from "./og";

describe("social card", () => {
  test("[FR-FW-7] each page's card shows the name, its title and line, the chains and the address", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
    for (const page of Object.values(OG_PAGES)) {
      const { unmount } = render(<OgCard {...page} />);
      expect(screen.getByText("Feedwatch")).toBeInTheDocument();
      expect(screen.getByText(page.title)).toBeInTheDocument();
      expect(screen.getByText(page.subtitle)).toBeInTheDocument();
      for (const chain of ["Ethereum", "Arbitrum", "Base"]) expect(screen.getByText(chain)).toBeInTheDocument();
      expect(screen.getByText("feedwatch.sholaayeni.xyz")).toBeInTheDocument();
      unmount();
    }
  });

  test("[FR-FW-7] the mark scales to the requested size", () => {
    const { container } = render(<OgMark size={180} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "180");
    expect(svg?.querySelector("path")).toHaveAttribute("d", "M5.5 17.5h5l2.5-6.5 4 12 3-8 1.5 2.5h5");
  });
});
