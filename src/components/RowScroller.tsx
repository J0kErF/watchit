"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useT } from "./LangProvider";

function Arrow({ dir }: { dir: "back" | "forward" }) {
  // Drawn for left-to-right; mirrored in right-to-left, where "back" is on the right.
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className="rtl:-scale-x-100">
      <path d={dir === "back" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/** A horizontally scrolling row with page-by-page arrow buttons on pointer devices. */
export function RowScroller({ children, label }: { children: ReactNode; label: string }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // In right-to-left, scrollLeft runs from 0 down to negative values; its size is the distance.
    const update = () => {
      const offset = Math.abs(el.scrollLeft);
      setEdges({ start: offset <= 4, end: offset + el.clientWidth >= el.scrollWidth - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollBy({ left: sign * dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const button =
    "absolute inset-y-0 z-20 hidden w-10 items-center justify-center bg-black/55 text-white opacity-0 transition hover:bg-black/75 focus-visible:opacity-100 group-hover/row:opacity-100 sm:w-12 [@media(hover:hover)]:flex";

  return (
    <div className="group/row relative">
      {!edges.start && (
        <button type="button" onClick={() => page(-1)} aria-label={t("Scroll {label} back", { label })} className={`${button} start-0`}>
          <Arrow dir="back" />
        </button>
      )}
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 py-3 sm:gap-3 sm:scroll-px-12 sm:px-12"
      >
        {children}
      </div>
      {!edges.end && (
        <button type="button" onClick={() => page(1)} aria-label={t("Scroll {label} forward", { label })} className={`${button} end-0`}>
          <Arrow dir="forward" />
        </button>
      )}
    </div>
  );
}
