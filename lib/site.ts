import type { Metadata } from "next";

/**
 * Site identity and per-page metadata (SEO, Open Graph, Twitter cards). One place, so every page
 * describes itself the same way. The URL can be overridden at build time for another deployment.
 */
export const SITE = {
  name: "Feedwatch",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://feedwatch.sholaayeni.xyz").replace(/\/+$/, ""),
  tagline: "Live health of RedStone push price feeds",
  description:
    "Feedwatch checks every RedStone push price feed on Ethereum, Arbitrum and Base each minute: freshness against its heartbeat, missed updates against a reference price, and how far the same feed differs across chains.",
  keywords: [
    "RedStone",
    "oracle",
    "price feeds",
    "push feeds",
    "heartbeat",
    "deviation",
    "Ethereum",
    "Arbitrum",
    "Base",
    "monitoring",
  ],
  /** The brand colour, for places CSS tokens can't reach: the manifest and generated images. */
  brand: "#7364db",
  canvas: "#f5f5fa",
  surface: "#ffffff",
  ink: "#16161e",
  muted: "#4d4d5c",
  line: "#e2e2ea",
} as const;

export type PageSeo = {
  /** Page title, without the site name (the layout's template adds it). */
  title: string;
  description: string;
  /** The page's path, such as `/compare/`. */
  path: string;
  /** Keep out of search results, such as a page whose content depends on its query string. */
  noindex?: boolean;
  /**
   * Use the title as given, without the layout's "· Feedwatch" template. Needed for the home page:
   * Next doesn't apply a layout's template to the page in its own segment.
   */
  home?: boolean;
};

/** Metadata for one page: title, description, canonical URL, Open Graph and Twitter card. */
export function pageMetadata({ title, description, path, noindex = false, home = false }: PageSeo): Metadata {
  const url = `${SITE.url}${path}`;
  const full = home ? `${SITE.name} · ${title}` : `${title} · ${SITE.name}`;
  return {
    title: home ? { absolute: full } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: full,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_GB",
    },
    twitter: { card: "summary_large_image", title: full, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Structured data for the site, as schema.org JSON-LD. */
export function structuredData(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
