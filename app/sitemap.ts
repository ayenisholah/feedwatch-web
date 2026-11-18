import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

// The indexable pages. A feed's detail page depends on its query string, so it's left out.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, changeFrequency: "always", priority: 1 },
    { url: `${SITE.url}/compare/`, changeFrequency: "always", priority: 0.8 },
    { url: `${SITE.url}/incidents/`, changeFrequency: "hourly", priority: 0.6 },
  ];
}
