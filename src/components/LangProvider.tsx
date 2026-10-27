"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { type Lang, t } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");
const KidsContext = createContext(false);

/** The viewer's settings from cookies: the interface language and Kids mode. */
export function LangProvider({ lang, kids, children }: { lang: Lang; kids: boolean; children: ReactNode }) {
  return (
    <LangContext value={lang}>
      <KidsContext value={kids}>{children}</KidsContext>
    </LangContext>
  );
}

export const useLang = () => useContext(LangContext);

export const useKids = () => useContext(KidsContext);

/** `t()` bound to the interface language, for client components. */
export function useT() {
  const lang = useLang();
  return useCallback((text: string, vars?: Record<string, string | number>) => t(lang, text, vars), [lang]);
}
