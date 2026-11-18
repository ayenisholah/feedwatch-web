import { appIcon } from "@/lib/og-image";

// The home-screen icon for iOS, written at build time.
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default appIcon(180);
