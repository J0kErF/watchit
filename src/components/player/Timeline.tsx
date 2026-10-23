"use client";

import { useRef, useState } from "react";
import { formatClock } from "./time";
import { thumbnailAt, type Thumbnail } from "./thumbnails";

const PREVIEW_WIDTH = 192;

/** The seek bar: played and buffered ranges, a hover time with a preview image, and drag to seek. */
export function Timeline({
  time,
  duration,
  buffered,
  thumbnails,
  onSeek,
  onScrub,
}: {
  time: number;
  duration: number;
  buffered: number;
  thumbnails: Thumbnail[];
  onSeek: (time: number) => void;
  /** Called with true while the viewer drags the handle. */
  onScrub: (scrubbing: boolean) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ time: number; x: number; width: number } | null>(null);
  const [dragTime, setDragTime] = useState<number | null>(null);

  const timeAt = (clientX: number) => {
    const rect = barRef.current!.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    return { time: duration ? (x / rect.width) * duration : 0, x, width: rect.width };
  };

  const shown = dragTime ?? time;
  const pct = (t: number) => `${duration ? Math.min((t / duration) * 100, 100) : 0}%`;
  const thumb = hover ? thumbnailAt(thumbnails, hover.time) : undefined;
  const previewLeft = hover ? Math.min(Math.max(hover.x - PREVIEW_WIDTH / 2, 0), hover.width - PREVIEW_WIDTH) : 0;

  return (
    <div
      ref={barRef}
      role="slider"
      tabIndex={-1}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={`${formatClock(shown)} of ${formatClock(duration)}`}
      className="group relative flex h-6 flex-1 cursor-pointer touch-none items-center"
      onPointerMove={(e) => {
        const at = timeAt(e.clientX);
        if (e.pointerType === "mouse" || dragTime !== null) setHover(at);
        if (dragTime !== null) setDragTime(at.time);
      }}
      onPointerLeave={() => dragTime === null && setHover(null)}
      onPointerDown={(e) => {
        if (!duration) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const at = timeAt(e.clientX);
        setDragTime(at.time);
        setHover(at);
        onScrub(true);
      }}
      onPointerUp={(e) => {
        if (dragTime === null) return;
        onSeek(timeAt(e.clientX).time);
        setDragTime(null);
        if (e.pointerType !== "mouse") setHover(null);
        onScrub(false);
      }}
      onPointerCancel={() => {
        setDragTime(null);
        setHover(null);
        onScrub(false);
      }}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] group-hover:h-1.5">
        <div className="absolute inset-y-0 left-0 bg-white/40" style={{ width: pct(buffered) }} />
        {hover && <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${hover.x}px` }} />}
        <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: pct(shown) }} />
      </div>
      <div
        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow transition-transform ${
          dragTime !== null ? "scale-125" : "scale-100"
        }`}
        style={{ left: pct(shown) }}
      />

      {hover && duration > 0 && (
        <div className="pointer-events-none absolute bottom-7 flex flex-col items-center gap-1.5" style={{ left: previewLeft, width: PREVIEW_WIDTH }}>
          {thumb && <Preview thumb={thumb} />}
          <span className="rounded bg-black/80 px-2 py-0.5 text-sm font-medium tabular-nums">{formatClock(hover.time)}</span>
        </div>
      )}
    </div>
  );
}

/** A preview image, or its region of a sprite sheet, scaled to the preview width. */
function Preview({ thumb }: { thumb: Thumbnail }) {
  const { rect } = thumb;
  const frame = "overflow-hidden rounded-md border-2 border-white/90 bg-black shadow-lg";
  const image = `url("${thumb.url.replace(/"/g, "%22")}")`;
  if (!rect) {
    return <div className={frame} style={{ width: PREVIEW_WIDTH, aspectRatio: "16 / 9", backgroundImage: image, backgroundSize: "cover" }} />;
  }
  const scale = PREVIEW_WIDTH / rect.w;
  return (
    <div className={frame} style={{ width: PREVIEW_WIDTH, height: rect.h * scale }}>
      <div
        style={{
          width: rect.w,
          height: rect.h,
          backgroundImage: image,
          backgroundPosition: `-${rect.x}px -${rect.y}px`,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      />
    </div>
  );
}
