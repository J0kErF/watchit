"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/** A horizontally scrolling row with page-by-page arrow buttons on pointer devices. */
export function RowScroller({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
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
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const button =
    "absolute inset-y-0 z-20 hidden w-10 items-center justify-center bg-black/55 text-white opacity-0 transition hover:bg-black/75 focus-visible:opacity-100 group-hover/row:opacity-100 sm:w-12 [@media(hover:hover)]:flex";

  return (
    <div className="group/row relative">
      {!edges.start && (
        <button type="button" onClick={() => page(-1)} aria-label={`Scroll ${label} left`} className={`${button} left-0`}>
          <Arrow dir="left" />
        </button>
      )}
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 py-3 sm:gap-3 sm:scroll-px-12 sm:px-12"
      >
        {children}
      </div>
      {!edges.end && (
        <button type="button" onClick={() => page(1)} aria-label={`Scroll ${label} right`} className={`${button} right-0`}>
          <Arrow dir="right" />
        </button>
      )}
    </div>
  );
}
