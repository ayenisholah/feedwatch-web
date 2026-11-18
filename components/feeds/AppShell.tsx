"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle/ThemeToggle";
import { HealthSchema } from "@/lib/api/schemas";
import { useApi } from "@/lib/api/use-api";
import { cn } from "@/lib/cn";
import { formatAgo } from "@/lib/format";
import { useNow } from "@/lib/use-query-param";
import { Logo } from "./Logo";

/** The pages in the main navigation. Each page is added here when it's built. */
export const NAV = [
  { id: "overview", href: "/", label: "Overview" },
  { id: "compare", href: "/compare/", label: "Compare" },
  { id: "incidents", href: "/incidents/", label: "Incidents" },
] as const;
export type NavId = (typeof NAV)[number]["id"];

/** Grafana's provisioned dashboard, on the same origin (feedwatch-platform `caddy/Caddyfile`). */
export const GRAFANA_HREF = "/grafana/d/feedwatch-feeds";

const link =
  "rounded-sm outline-none focus-visible:ring-4 focus-visible:ring-focus-ring underline-offset-4 hover:underline";

/** Whether the poller and API are working, from `/api/health`, as a small dot and label. */
export function HealthPill() {
  const health = useApi("/api/health", HealthSchema, { refreshMs: 60_000 });
  const now = useNow();
  let tone = "bg-fg-subtle";
  let label = "Checking status…";
  if (health.state === "error") {
    tone = "bg-danger";
    label = "API unreachable";
  } else if (health.state !== "loading") {
    const ok = health.data.status === "ok";
    tone = ok ? "bg-success" : "bg-warning";
    label = `${ok ? "Live" : "Delayed"} · last poll ${formatAgo(health.data.lastPollAt, now)}`;
  }
  return (
    <p role="status" className="inline-flex items-center gap-2 text-description text-fg-muted">
      <span aria-hidden="true" className={cn("size-2 rounded-full", tone)} />
      {label}
    </p>
  );
}

/**
 * Header with the brand, navigation, live status and theme switch, around a page's content.
 * `current` marks the page's nav link; pages outside the nav (such as a feed's detail) omit it.
 */
export function AppShell({ current, children }: { current?: NavId; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Feedwatch home" className={link}>
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-4 text-body">
            {NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={item.id === current ? "page" : undefined}
                className={cn(link, item.id === current ? "font-semibold text-fg" : "text-fg-muted")}
              >
                {item.label}
              </Link>
            ))}
            <a href={GRAFANA_HREF} className={cn(link, "text-fg-muted")}>
              Grafana
            </a>
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <HealthPill />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
