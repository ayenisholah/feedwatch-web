import { describe, expect, test } from "vitest";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { pageMetadata, SITE, structuredData } from "./site";

describe("site metadata", () => {
  test("[FR-FW-7] a page gets its title, canonical URL, Open Graph and Twitter card", () => {
    const meta = pageMetadata({ title: "Compare chains", description: "Side by side.", path: "/compare/" });
    expect(meta.title).toBe("Compare chains");
    expect(meta.alternates?.canonical).toBe(`${SITE.url}/compare/`);
    expect(meta.openGraph).toMatchObject({
      title: "Compare chains · Feedwatch",
      url: `${SITE.url}/compare/`,
      siteName: "Feedwatch",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Compare chains · Feedwatch" });
    expect(meta.robots).toBeUndefined();
  });

  test("[FR-FW-7] the home page sets its full title; query-string pages stay out of search", () => {
    const home = pageMetadata({ title: "RedStone feed health", description: "d", path: "/", home: true });
    expect(home.title).toEqual({ absolute: "Feedwatch · RedStone feed health" });
    expect(home.openGraph?.title).toBe("Feedwatch · RedStone feed health");
    const feed = pageMetadata({ title: "Feed detail", description: "d", path: "/feed/", noindex: true });
    expect(feed.robots).toEqual({ index: false, follow: true });
  });

  test("[FR-FW-7] structured data, manifest, robots and sitemap describe the site", () => {
    expect(structuredData()).toMatchObject({ "@type": "WebApplication", name: "Feedwatch", url: SITE.url });
    expect(manifest()).toMatchObject({ short_name: "Feedwatch", start_url: "/", theme_color: SITE.brand });
    expect(manifest().icons?.map((i) => i.src)).toEqual(["/icon.svg", "/apple-icon"]);
    expect(robots()).toMatchObject({
      rules: { allow: "/", disallow: ["/api/", "/grafana/"] },
      sitemap: `${SITE.url}/sitemap.xml`,
    });
    expect(sitemap().map((e) => e.url)).toEqual([`${SITE.url}/`, `${SITE.url}/compare/`, `${SITE.url}/incidents/`]);
  });
});
