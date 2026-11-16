import { describe, expect, test } from "vitest";
import { cn } from "./cn";
import { applyTheme, readTheme, THEME_KEY, writeTheme } from "./theme";

describe("cn", () => {
  test("later Tailwind classes win", () => {
    expect(cn("px-2 text-fg", "px-4")).toBe("text-fg px-4");
  });
  test("type-scale and colour classes don't cancel each other", () => {
    expect(cn("text-body text-fg")).toBe("text-body text-fg");
    expect(cn("text-body", "text-h4")).toBe("text-h4");
  });
});

describe("theme", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };
  test("defaults to system and round-trips a choice", () => {
    const store = memory();
    expect(readTheme(store)).toBe("system");
    writeTheme(store, "dark");
    expect(store.getItem(THEME_KEY)).toBe("dark");
    expect(readTheme(store)).toBe("dark");
    writeTheme(store, "system");
    expect(store.getItem(THEME_KEY)).toBeNull();
  });
  test("ignores junk and survives storage errors", () => {
    expect(readTheme({ getItem: () => "purple" })).toBe("system");
    expect(
      readTheme({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe("system");
    expect(() =>
      writeTheme(
        {
          setItem: () => {
            throw new Error("blocked");
          },
          removeItem: () => {},
        },
        "dark",
      ),
    ).not.toThrow();
  });
  test("applyTheme sets or clears data-theme", () => {
    const el = document.createElement("html");
    applyTheme(el, "dark");
    expect(el.dataset.theme).toBe("dark");
    applyTheme(el, "system");
    expect(el.hasAttribute("data-theme")).toBe(false);
  });
});
