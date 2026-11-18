import { ImageResponse } from "next/og";
import { OG_PAGES, OG_SIZE, OgCard, OgMark } from "./og";

/**
 * Builds the route files' image functions. Rendering needs `next/og` (satori and resvg), so this
 * thin layer is exercised by `next build`, which writes every image, rather than by unit tests.
 */
export function socialImage(page: keyof typeof OG_PAGES) {
  return function Image() {
    return new ImageResponse(<OgCard {...OG_PAGES[page]} />, OG_SIZE);
  };
}

export function appIcon(size: number) {
  return function Icon() {
    return new ImageResponse(<OgMark size={size} />, { width: size, height: size });
  };
}
