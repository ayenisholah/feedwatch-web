import { cn } from "@/lib/cn";

/**
 * The Feedwatch mark: a pulse line ending in a live dot, on the brand square. The same drawing is
 * `app/icon.svg` (favicon) and the generated app and social images (`lib/og.tsx`).
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <path
        d="M5.5 17.5h5l2.5-6.5 4 12 3-8 1.5 2.5h5"
        className="stroke-on-brand"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26.5" cy="17.5" r="2" className="fill-on-brand" />
    </svg>
  );
}

/** The mark with the wordmark, for the header. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-subtitle-semibold text-fg", className)}>
      <LogoMark />
      Feedwatch
    </span>
  );
}
