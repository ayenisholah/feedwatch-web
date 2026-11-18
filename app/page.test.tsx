import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { fixtures, stubApi } from "@/test/api-stub";
import Home from "./page";

afterEach(() => vi.unstubAllGlobals());

describe("home page", () => {
  test("[FR-FW-7] is the overview inside the app shell", async () => {
    stubApi({ "/api/feeds": { body: fixtures.feeds }, "/api/health": { body: fixtures.health } });
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Feeds" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
