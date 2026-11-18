import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  // Contract tests run in the node environment, with no DOM to clean.
  if (typeof document === "undefined") return;
  cleanup();
  document.documentElement.removeAttribute("data-theme");
  try {
    window.localStorage.clear();
  } catch {
    // Storage blocked in this environment: nothing to clear.
  }
});
