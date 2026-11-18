import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import open from "@/e2e/fixtures/incidents-open.json";
import { stubApi } from "@/test/api-stub";
import IncidentsPage from "./page";

afterEach(() => vi.unstubAllGlobals());

describe("incidents page", () => {
  test("[FR-FW-7] is the incidents view inside the app shell, marked current", async () => {
    stubApi({ "/api/incidents": { body: open } });
    render(<IncidentsPage />);
    expect(screen.getByRole("link", { name: "Incidents" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("list", { name: "Incidents, newest first" })).toBeInTheDocument();
  });
});
