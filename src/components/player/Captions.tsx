"use client";

import { type CSSProperties, type ReactNode } from "react";
import { DEFAULT_CAPTION, setCaptionStyle, type CaptionEdge, type CaptionStyle } from "./prefs";

const FONTS: Record<CaptionStyle["font"], { label: string; css: string }> = {
  sans: { label: "Default", css: "var(--font-geist-sans), system-ui, sans-serif" },
  serif: { label: "Serif", css: "Georgia, 'Times New Roman', serif" },
  mono: { label: "Monospace", css: "ui-monospace, 'Cascadia Mono', Menlo, monospace" },
  display: { label: "Display", css: "var(--font-display), system-ui, sans-serif" },
  casual: { label: "Casual", css: "'Comic Sans MS', 'Comic Neue', 'Segoe Print', cursive" },
};

const EDGES: Record<CaptionEdge, { label: string; css: string }> = {
  none: { label: "None", css: "none" },
  shadow: { label: "Drop shadow", css: "0 2px 4px rgb(0 0 0 / 0.9), 0 0 2px rgb(0 0 0 / 0.9)" },
  raised: { label: "Raised", css: "1px 1px 0 #222, 2px 2px 0 #111" },
  depressed: { label: "Depressed", css: "-1px -1px 0 #222, -2px -2px 0 #111" },
  outline: { label: "Outline", css: "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000" },
};

const COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Yellow", value: "#ffe14d" },
  { label: "Cyan", value: "#5ee7ff" },
  { label: "Green", value: "#7dff8a" },
  { label: "Magenta", value: "#ff6bf0" },
  { label: "Red", value: "#ff5c5c" },
  { label: "Blue", value: "#6b9bff" },
  { label: "Black", value: "#000000" },
];

const SIZES = [
  { label: "Small", value: 0.75 },
  { label: "Medium", value: 1 },
  { label: "Large", value: 1.4 },
  { label: "Extra large", value: 1.9 },
];

const OPACITIES = [
  { label: "None", value: 0 },
  { label: "Light", value: 0.35 },
  { label: "Medium", value: 0.65 },
  { label: "Solid", value: 1 },
];

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
}

export function captionCss(style: CaptionStyle): CSSProperties {
  return {
    color: style.color,
    fontFamily: FONTS[style.font].css,
    fontSize: `calc(clamp(16px, 2.5vw, 44px) * ${style.size})`,
    textShadow: EDGES[style.edge].css,
    backgroundColor: rgba(style.background, style.backgroundOpacity),
  };
}

/** Cue text with <b>, <i> and <u> kept and every other tag (voices, classes, timestamps) dropped. */
function renderCue(text: string): ReactNode {
  const out: ReactNode[] = [];
  const open = { b: 0, i: 0, u: 0 };
  text.split(/(<\/?[^>]+>)/).forEach((part, i) => {
    const tag = /^<(\/?)([biu])(?:[.\s][^>]*)?>$/i.exec(part);
    if (tag) {
      open[tag[2].toLowerCase() as "b" | "i" | "u"] += tag[1] ? -1 : 1;
      return;
    }
    if (part.startsWith("<") || !part) return;
    const decoded = part.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
    out.push(
      <span
        key={i}
        style={{
          fontWeight: open.b > 0 ? 700 : undefined,
          fontStyle: open.i > 0 ? "italic" : undefined,
          textDecoration: open.u > 0 ? "underline" : undefined,
        }}
      >
        {decoded}
      </span>,
    );
  });
  return out;
}

/** The current cues, drawn over the video in the viewer's caption style. */
export function Captions({ cues, style, raised }: { cues: string[]; style: CaptionStyle; raised: boolean }) {
  if (!cues.length) return null;
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-[5] flex flex-col items-center gap-1 px-[6%] text-center transition-[bottom] duration-300 ${
        raised ? "bottom-36 sm:bottom-40" : "bottom-[7%]"
      }`}
    >
      {cues.map((cue, i) => (
        <p key={i} dir="auto" className="max-w-full whitespace-pre-line rounded px-2 py-0.5 leading-snug" style={captionCss(style)}>
          {renderCue(cue)}
        </p>
      ))}
    </div>
  );
}

function Choice<T>({
  label,
  options,
  value,
  onChange,
  swatch,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  swatch?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const selected = o.value === value;
          return swatch ? (
            <button
              key={o.label}
              type="button"
              title={o.label}
              aria-label={o.label}
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`h-7 w-7 rounded-full border-2 transition ${selected ? "border-accent scale-110" : "border-white/30 hover:border-white/70"}`}
              style={{ backgroundColor: String(o.value) }}
            />
          ) : (
            <button
              key={o.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`rounded-full px-3 py-1 text-sm transition ${selected ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Caption appearance and timing, with a live sample. */
export function CaptionStylePanel({ style }: { style: CaptionStyle }) {
  return (
    <div className="space-y-5">
      <div className="grid h-24 place-items-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#3b3350,#1a2a3a)]">
        <span className="rounded px-2 py-0.5" style={{ ...captionCss(style), fontSize: `${22 * style.size}px` }}>
          This is how captions will look
        </span>
      </div>
      <Choice label="Text size" options={SIZES} value={style.size} onChange={(size) => setCaptionStyle({ size })} />
      <Choice label="Text color" options={COLORS} value={style.color} onChange={(color) => setCaptionStyle({ color })} swatch />
      <Choice
        label="Font"
        options={Object.entries(FONTS).map(([value, f]) => ({ label: f.label, value: value as CaptionStyle["font"] }))}
        value={style.font}
        onChange={(font) => setCaptionStyle({ font })}
      />
      <Choice
        label="Text edge"
        options={Object.entries(EDGES).map(([value, e]) => ({ label: e.label, value: value as CaptionEdge }))}
        value={style.edge}
        onChange={(edge) => setCaptionStyle({ edge })}
      />
      <Choice label="Background" options={OPACITIES} value={style.backgroundOpacity} onChange={(backgroundOpacity) => setCaptionStyle({ backgroundOpacity })} />
      {style.backgroundOpacity > 0 && (
        <Choice label="Background color" options={COLORS} value={style.background} onChange={(background) => setCaptionStyle({ background })} swatch />
      )}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">Timing</legend>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCaptionStyle({ delay: Math.round((style.delay - 0.25) * 100) / 100 })}
            className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            Earlier
          </button>
          <span className="w-20 text-center text-sm tabular-nums">{style.delay > 0 ? "+" : ""}{style.delay.toFixed(2)}s</span>
          <button
            type="button"
            onClick={() => setCaptionStyle({ delay: Math.round((style.delay + 0.25) * 100) / 100 })}
            className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            Later
          </button>
        </div>
      </fieldset>
      <button
        type="button"
        onClick={() => setCaptionStyle(DEFAULT_CAPTION)}
        className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
      >
        Reset to default
      </button>
    </div>
  );
}

