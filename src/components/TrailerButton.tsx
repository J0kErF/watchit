"use client";

import { useEffect, useState } from "react";
import { useT } from "./LangProvider";

/** "Trailer" button that plays the title's YouTube trailer in an overlay. */
export function TrailerButton({ videoId, title }: { videoId: string; title: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 rounded-md bg-white/25 px-6 py-2.5 text-base font-bold backdrop-blur transition hover:bg-white/15 sm:px-8 sm:py-3 sm:text-lg"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
          <path d="m10 9 5 3-5 3z" fill="currentColor" />
        </svg>
        {t("Trailer")}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("{title} trailer", { title })}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("Close trailer")}
              className="absolute -top-12 end-0 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-2xl transition hover:bg-white/20"
            >
              ×
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={t("{title} trailer", { title })}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="aspect-video w-full rounded-lg border-0 bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
