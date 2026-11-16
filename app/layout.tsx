import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

// Frox type: Poppins, only the weights the type scale uses.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Feedwatch", template: "%s · Feedwatch" },
  description: "Freshness, missed updates and cross-chain spread for RedStone push price feeds.",
  applicationName: "Feedwatch",
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
      </head>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-body text-fg">{children}</body>
    </html>
  );
}
