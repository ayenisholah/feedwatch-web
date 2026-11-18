import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import compare from "@/e2e/fixtures/compare.json";
import { stubApi } from "@/test/api-stub";
import ComparePage from "./page";

afterEach(() => vi.unstubAllGlobals());

describe("compare page", () => {
  test("[FR-FW-7] is the compare view inside the app shell, marked current", async () => {
    stubApi({ "/api/compare": { body: compare } });
    render(<ComparePage />);
    expect(screen.getByRole("link", { name: "Compare" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
