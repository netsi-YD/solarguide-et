"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Globe } from "lucide-react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  TRANSLATIONS,
  type Language,
  type TranslationDictionary,
} from "@/lib/translations";

interface LanguageContextValue {
  lang: Language;
  setLang: (next: Language) => void;
  t: TranslationDictionary;
}

const LanguageContext = React.createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: TRANSLATIONS[DEFAULT_LANGUAGE],
});

export function useLanguage(): LanguageContextValue {
  return React.useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>(DEFAULT_LANGUAGE);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang");
      if (urlLang === "am" || urlLang === "en") {
        setLangState(urlLang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLang);
        return;
      }

      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "am" || saved === "en") {
        setLangState(saved);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const setLang = React.useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const activeLang: Language = isAdminRoute ? "en" : lang;
  const t = TRANSLATIONS[activeLang];

  const contextValue = React.useMemo(
    () => ({
      lang: activeLang,
      setLang,
      t,
    }),
    [activeLang, setLang, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3 sm:px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-slate-900 min-w-0"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
              <Sun className="size-4.5" />
            </span>
            <div className="flex flex-col leading-tight truncate">
              <span className="text-sm sm:text-base font-bold truncate">
                SolarGuide <span className="text-amber-600">ET</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 truncate sm:hidden">
                {t.meta.brandSubtitle}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200/70">
              {t.meta.brandSubtitle}
            </span>

            {!isAdminRoute && (
              <div
                role="group"
                aria-label={t.meta.langToggleLabel}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium"
              >
                <button
                  type="button"
                  onClick={() => setLang("am")}
                  aria-pressed={lang === "am"}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                    lang === "am"
                      ? "bg-white text-amber-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Globe className="size-3 text-amber-600 hidden xs:inline" />
                  አማርኛ
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  aria-pressed={lang === "en"}
                  className={`rounded-md px-2.5 py-1 transition-all ${
                    lang === "en"
                      ? "bg-white text-amber-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-4 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-3xl px-4">{t.meta.footerText}</div>
      </footer>
    </LanguageContext.Provider>
  );
}
