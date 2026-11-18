import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { stubApi } from "@/test/api-stub";
import FeedPage from "./page";

afterEach(() => vi.unstubAllGlobals());

describe("feed page", () => {
  test("[FR-FW-7] is the feed detail inside the app shell, with no nav item current", async () => {
    stubApi({});
    render(<FeedPage />);
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
    expect(await screen.findByText("Feed not found")).toBeInTheDocument();
  });
});
