import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Badge, badgeVariants } from "./Badge";

describe("Badge", () => {
  test("soft tones map to status colours", () => {
    expect(badgeVariants({ tone: "success" })).toContain("bg-success-soft");
    expect(badgeVariants({ tone: "danger" })).toContain("text-danger");
    expect(badgeVariants({ variant: "solid", tone: "neutral" })).toContain("bg-neutral-1000");
    expect(badgeVariants({ variant: "ghost", tone: "brand" })).toContain("border-brand");
  });
  test("bubble shape for counts", () => {
    render(
      <Badge shape="bubble" variant="solid">
        3
      </Badge>,
    );
    expect(screen.getByText("3").className).toContain("rounded-full");
  });
  test("a preset colour overrides the tone and renders soft", () => {
    render(
      <Badge color="violet" tone="danger">
        Feed
      </Badge>,
    );
    const badge = screen.getByText("Feed");
    expect(badge.className).toContain("text-preset-violet");
    expect(badge.className).not.toContain("text-danger");
  });
});
