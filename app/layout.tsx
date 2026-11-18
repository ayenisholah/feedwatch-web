import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { SITE, structuredData } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

// Frox type: Poppins, only the weights the type scale uses.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Site-wide defaults; each page adds its own title, description and canonical URL (lib/site.ts).
// Icons, the manifest and social images come from files in app/: icon.svg, apple-icon,
// opengraph-image, twitter-image and manifest.ts.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  category: "technology",
  openGraph: { siteName: SITE.name, type: "website", locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2128" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set before paint by the inline script, so the first render may differ on it.
    <html lang="en" className={`${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-body text-fg">{children}</body>
    </html>
  );
}
