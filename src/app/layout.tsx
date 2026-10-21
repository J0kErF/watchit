import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Instrument_Serif({
  variable: "--font-display",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "WatchIt — Classic movies & series", template: "%s · WatchIt" },
  description: "Stream public-domain movies and TV series from the Internet Archive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${display.variable} h-full antialiased`}>
      <body className="grain flex min-h-full flex-col">
        {/* usePathname is runtime data on dynamic routes, so the nav streams in behind a static shell */}
        <Suspense fallback={<div className="fixed inset-x-0 top-0 z-50 h-16 bg-gradient-to-b from-black/80 to-transparent" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-4 py-8 text-sm text-muted sm:px-10">
          <p>
            WatchIt streams public-domain and openly licensed films directly from the{" "}
            <a href="https://archive.org" className="text-foreground underline-offset-4 hover:underline">
              Internet Archive
            </a>
            . No accounts, no tracking — your list stays in this browser.
          </p>
        </footer>
      </body>
    </html>
  );
}
