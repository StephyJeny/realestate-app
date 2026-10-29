"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isValidLocale, Locale, translate, TranslationKey } from "@/lib/i18n";

interface LanguageContextType {
    locale: Locale;
    setLocale: (next: Locale) => void;
    toggleLocale: () => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "estatevue_locale";

const LanguageContext = createContext<LanguageContextType>({
    locale: "en",
    setLocale: () => {},
    toggleLocale: () => {},
    t: (key, vars) => translate("en", key, vars),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (isValidLocale(saved)) {
                setLocaleState(saved);
                document.documentElement.lang = saved;
            }
        } catch {
            // Ignore storage access errors in restricted browsers
        }
    }, []);

    const setLocale = useCallback((next: Locale) => {
        if (!isValidLocale(next)) return;
        setLocaleState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
            document.documentElement.lang = next;
        } catch {
            // Ignore storage errors
        }
    }, []);

    const toggleLocale = useCallback(() => {
        setLocale(locale === "en" ? "sw" : "en");
    }, [locale, setLocale]);

    const t = useCallback(
        (key: TranslationKey, vars?: Record<string, string | number>) =>
            translate(locale, key, vars),
        [locale]
    );

    return (
        <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
