import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "WatchIt — Movies & series", template: "%s · WatchIt" },
  description: "Trending movies, new series and all-time favorites, ready to watch.",
};

export const viewport: Viewport = { themeColor: "#0b0b0c" };

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/my-list", label: "My List" },
  { href: "/search", label: "Search" },
  { href: "/library", label: "Library" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* usePathname is runtime data on dynamic routes, so the nav streams in behind a static shell */}
        <Suspense fallback={<div className="fixed inset-x-0 top-0 z-50 h-16 bg-gradient-to-b from-black/80 to-transparent" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="mt-10 border-t border-line px-4 py-10 text-sm text-muted sm:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <Link href="/" className="font-display text-3xl leading-none tracking-wide text-accent">
              WatchIt
            </Link>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>No accounts, no tracking. Your list stays in this browser.</p>
            <p className="flex items-center gap-2">
              Title data and images from
              <a href="https://www.themoviedb.org" className="font-semibold text-foreground hover:underline">
                TMDB
              </a>
              · This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
