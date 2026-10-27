import type { Metadata, Viewport } from "next";
import { Alexandria, Geist, Rubik } from "next/font/google";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { InstallApp } from "@/components/InstallApp";
import { LangProvider } from "@/components/LangProvider";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { LANG_COOKIE, type Lang, t } from "@/lib/i18n";
import { getKids, getLang } from "@/lib/lang";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Alexandria also sets the Arabic interface.
const display = Alexandria({
  variable: "--font-display",
  subsets: ["latin", "arabic"],
});

// Neither Geist nor Alexandria has Hebrew; Rubik sets the Hebrew interface.
const hebrew = Rubik({
  variable: "--font-hebrew",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Jawy — Movies & series", template: "%s · Jawy" },
  description: "Trending movies, new series and all-time favorites, ready to watch.",
  applicationName: "Jawy",
  openGraph: { siteName: "Jawy", type: "website" },
  twitter: { card: "summary_large_image" },
  // Opened from the iPhone home screen, the site runs full screen like an app.
  appleWebApp: { capable: true, title: "Jawy", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#110e1a" };

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/my-list", label: "My List" },
  { href: "/search", label: "Search" },
  { href: "/library", label: "Library" },
];

// The page shell is static, so the language and direction come from the cookie before first paint.
const SET_DIRECTION = `var m = document.cookie.match(/(?:^|; )${LANG_COOKIE}=(ar|he)(?:;|$)/); if (m) { document.documentElement.lang = m[1]; document.documentElement.dir = "rtl"; }`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${geistSans.variable} ${display.variable} ${hebrew.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SET_DIRECTION }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="fixed inset-x-0 top-0 z-50 h-16 bg-gradient-to-b from-black/80 to-transparent" />}>
          <WithLang>{children}</WithLang>
        </Suspense>
      </body>
    </html>
  );
}

/** Everything that depends on the interface language, which is runtime data (a cookie). */
async function WithLang({ children }: { children: ReactNode }) {
  const [lang, kids] = await Promise.all([getLang(), getKids()]);
  return (
    <LangProvider lang={lang} kids={kids}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer lang={lang} />
    </LangProvider>
  );
}

function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-10 border-t border-line px-4 py-10 text-sm text-muted sm:px-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <Link href="/" aria-label={t(lang, "Jawy home")}>
          <Logo className="h-10 w-auto" />
        </Link>
        <ul className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
          {FOOTER_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition-colors hover:text-foreground">
                {t(lang, l.label)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="flex flex-wrap items-center gap-3">
          {t(lang, "No accounts, no tracking. Your list stays in this browser.")}
          <InstallApp />
        </p>
        <p className="flex items-center gap-2">
          {t(lang, "Title data and images from")}
          <a href="https://www.themoviedb.org" className="font-semibold text-foreground hover:underline">
            TMDB
          </a>
          · {t(lang, "This product uses the TMDB API but is not endorsed or certified by TMDB.")}
        </p>
      </div>
    </footer>
  );
}
