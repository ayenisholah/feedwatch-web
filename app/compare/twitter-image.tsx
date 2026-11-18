import { OG_PAGES, OG_SIZE } from "@/lib/og";
import { socialImage } from "@/lib/og-image";

// The compare page's social preview card, written at build time.
export const dynamic = "force-static";
export const alt = `${OG_PAGES.compare.title}: Feedwatch`;
export const size = OG_SIZE;
export const contentType = "image/png";
export default socialImage("compare");
