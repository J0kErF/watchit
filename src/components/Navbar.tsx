"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/my-list", label: "My List" },
  { href: "/library", label: "Library" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");

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
      <nav className="flex h-16 items-center gap-4 px-4 sm:gap-10 sm:px-12">
        <Link href="/" aria-label="Jawy home" className="shrink-0 drop-shadow">
          <Logo className="h-9 w-auto" />
        </Link>
        <ul className="no-scrollbar flex flex-1 gap-4 overflow-x-auto text-sm sm:gap-6">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href} className="shrink-0">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "font-semibold text-foreground" : "text-foreground/70 transition-colors hover:text-foreground/95"}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }}
          className={pathname === "/search" ? "hidden" : "hidden sm:block"}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            aria-label="Search titles"
            className="w-44 rounded-md border border-white/20 bg-black/50 px-3.5 py-1.5 text-sm outline-none transition-[width,border-color] placeholder:text-muted focus:w-60 focus:border-white/70 lg:w-56 lg:focus:w-72"
          />
        </form>
        <Link href="/search" aria-label="Search" className="text-muted hover:text-foreground sm:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
      </nav>
    </header>
  );
}
