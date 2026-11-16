import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { axeViolations } from "@/test/axe";
import Home from "./page";

describe("home placeholder", () => {
  test("[FR-FW-7] shows the empty state and a theme switch", async () => {
    const { container } = render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Feedwatch" })).toBeInTheDocument();
    expect(screen.getByText("Feeds will appear here")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});
