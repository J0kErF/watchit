"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/my-list", label: "My List" },
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
        scrolled ? "bg-background/95 backdrop-blur" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <nav className="flex h-16 items-center gap-4 px-4 sm:gap-8 sm:px-10">
        <Link href="/" className="font-display text-3xl leading-none tracking-tight">
          Watch<span className="text-accent italic">It</span>
        </Link>
        <ul className="no-scrollbar flex flex-1 gap-4 overflow-x-auto text-sm sm:gap-6">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href} className="shrink-0">
                <Link
                  href={l.href}
                  className={active ? "font-medium text-foreground" : "text-muted transition-colors hover:text-foreground"}
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
            className="w-44 rounded-full border border-line bg-surface/80 px-4 py-1.5 text-sm outline-none placeholder:text-muted focus:w-60 focus:border-accent lg:w-56 lg:focus:w-72 transition-[width,border-color]"
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
