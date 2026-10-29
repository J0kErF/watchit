"use client";

import { useEffect, useState } from "react";
import { useT } from "./LangProvider";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
}

/**
 * Registers the service worker (production only, so dev reloads stay fresh) and offers to install
 * the site as an app: the browser's install prompt where there is one (Chrome, Edge, Android), or
 * the Add to Home Screen steps on iPhone and iPad. Hidden once the site runs as an installed app.
 */
export function InstallApp() {
  const t = useT();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // iPadOS reports itself as a Mac, but with touch.
    const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    // Reading the browser has to wait for hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIos(apple && !("standalone" in navigator && navigator.standalone));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!prompt && !ios) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          if (!prompt) return setShowSteps((s) => !s);
          await prompt.prompt();
          setPrompt(null);
        }}
        className="rounded-full border border-accent/60 px-3 py-1 font-semibold text-accent transition hover:bg-accent hover:text-accent-ink"
      >
        {t("Install app")}
      </button>
      {showSteps && <span role="status">{t("To install Jawy, tap Share, then Add to Home Screen.")}</span>}
    </span>
  );
}
