"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { categoriesFor, categoryPath } from "@/lib/categories";
import { LANG_COOKIE, LANGS, langDir, parseLang } from "@/lib/i18n";
import { KIDS_COOKIE } from "@/lib/kids";
import type { Kind } from "@/lib/types";
import { useKids, useLang, useT } from "./LangProvider";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";

const LINKS: { href: string; label: string; menu?: Kind }[] = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies", menu: "movie" },
  { href: "/series", label: "Series", menu: "series" },
  { href: "/my-list", label: "My List" },
  { href: "/library", label: "Library" },
];

export function Navbar() {
  const pathname = usePathname();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/watch/")) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/95 shadow-lg shadow-black/40 backdrop-blur" : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      {/* On phones the links get a second line, so they aren't squeezed out by the switches. */}
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:h-16 sm:flex-nowrap sm:gap-10 sm:px-12 sm:py-0">
        <Link href="/" aria-label={t("Jawy home")} className="shrink-0 drop-shadow">
          <Logo className="h-9 w-auto" />
        </Link>
        <ul className="no-scrollbar flex flex-1 gap-5 overflow-x-auto text-sm max-sm:order-last max-sm:basis-full sm:gap-6 sm:overflow-visible">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href} className="group relative shrink-0">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "font-semibold text-foreground" : "text-foreground/70 transition-colors hover:text-foreground/95"}
                >
                  {t(l.label)}
                </Link>
                {l.menu && <CategoryMenu kind={l.menu} />}
              </li>
            );
          })}
        </ul>
        <div className={pathname === "/search" ? "hidden" : "hidden sm:block"}>
          <SearchBox />
        </div>
        <Link href="/search" aria-label={t("Search")} className="ms-auto text-muted hover:text-foreground sm:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
        <KidsSwitch />
        <LangSwitch />
      </nav>
    </header>
  );
}

const setCookie = (name: string, value: string) =>
  (document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`);

/** Switches the interface language: a cookie, then a re-render on the server. */
function LangSwitch() {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  return (
    <select
      value={lang}
      onChange={(e) => {
        const next = parseLang(e.target.value);
        setCookie(LANG_COOKIE, next);
        document.documentElement.lang = next;
        document.documentElement.dir = langDir(next);
        router.refresh();
      }}
      aria-label={t("Language")}
      className="shrink-0 cursor-pointer rounded-md border border-white/25 bg-black/50 px-1.5 py-1 text-sm font-semibold text-foreground/85 outline-none transition hover:border-white/70 focus:border-white"
    >
      {LANGS.map((l) => (
        <option key={l.value} value={l.value} lang={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

/** Turns Kids mode on or off: a cookie, then a re-render on the server. */
function KidsSwitch() {
  const kids = useKids();
  const t = useT();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        setCookie(KIDS_COOKIE, kids ? "0" : "1");
        router.refresh();
      }}
      aria-pressed={kids}
      title={t(kids ? "Turn off Kids mode" : "Turn on Kids mode")}
      className={`shrink-0 rounded-md border px-2.5 py-1 text-sm font-semibold transition ${
        kids
          ? "border-accent bg-accent text-accent-ink hover:brightness-110"
          : "border-white/25 text-foreground/85 hover:border-white/70 hover:text-foreground"
      }`}
    >
      {t("Kids")}
    </button>
  );
}

/** Categories, shown while the pointer or keyboard focus is on Movies or Series (wider screens only). */
function CategoryMenu({ kind }: { kind: Kind }) {
  const t = useT();
  const kids = useKids();
  return (
    <div className="invisible absolute -start-4 top-full pt-4 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 max-sm:hidden">
      <ul className="grid w-96 grid-cols-2 rounded-md border border-white/10 bg-background/95 py-2 shadow-xl shadow-black/50 backdrop-blur">
        {categoriesFor(kind, kids).map((c) => (
          <li key={c.slug}>
            <Link
              href={categoryPath(kind, c.slug)}
              // Drop focus so the menu closes once the pointer leaves.
              onClick={(e) => e.currentTarget.blur()}
              className="block px-4 py-2 text-foreground/80 transition-colors hover:bg-white/10 hover:text-foreground"
            >
              {t(c.label)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
