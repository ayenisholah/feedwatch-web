import { SITE } from "./site";

/**
 * The social preview card (1200 × 630) for Open Graph and Twitter, drawn as plain JSX for
 * `next/og`'s ImageResponse, which supports inline styles and flexbox only. Kept here, not in a
 * route file, so its content is unit-tested.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;

const MARK_PATH = "M5.5 17.5h5l2.5-6.5 4 12 3-8 1.5 2.5h5";

/** The logo mark at `size` px, for generated images (no CSS tokens there). */
export function OgMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={SITE.brand} />
      <path d={MARK_PATH} stroke={SITE.surface} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="26.5" cy="17.5" r="2" fill={SITE.surface} />
    </svg>
  );
}

/** A page's social card: the mark and name, the page title, one line about it, and the chains. */
export function OgCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: SITE.canvas,
        color: SITE.ink,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <OgMark size={72} />
        <span style={{ fontSize: 44, fontWeight: 700 }}>{SITE.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</span>
        <span style={{ fontSize: 34, color: SITE.muted, lineHeight: 1.35, maxWidth: 980 }}>{subtitle}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: SITE.muted }}>
        {["Ethereum", "Arbitrum", "Base"].map((chain) => (
          <span
            key={chain}
            style={{
              display: "flex",
              padding: "8px 22px",
              borderRadius: 999,
              background: SITE.surface,
              border: `2px solid ${SITE.line}`,
            }}
          >
            {chain}
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: SITE.brand, fontWeight: 600 }}>
          {SITE.url.replace(/^https?:\/\//, "")}
        </span>
      </div>
    </div>
  );
}

/** The card's text per page: one place for the four routes' social previews. */
export const OG_PAGES = {
  overview: {
    title: "RedStone feed health",
    subtitle: "Every push price feed, checked each minute against its heartbeat and a reference price.",
  },
  compare: {
    title: "Compare chains",
    subtitle: "The same feed on Ethereum, Arbitrum and Base, side by side, with the spread between them.",
  },
  incidents: {
    title: "Incidents",
    subtitle: "When a feed went stale, missed an update or couldn't be read, and when it recovered.",
  },
  feed: {
    title: "Feed detail",
    subtitle: "One feed's latest reading, and 24 hours of value and age against its heartbeat.",
  },
} as const;
