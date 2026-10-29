"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CurrencyCode = "KES" | "USD" | "EUR" | "GBP";

export interface CurrencyConfig {
    code: CurrencyCode;
    symbol: string;
    label: string;
    rateFromKES: number; // Multiply KES amount by this rate
    flag: string;
    defaultTimezone: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    KES: { code: "KES", symbol: "KES ", label: "KES (Kenyan Shilling)", rateFromKES: 1, flag: "🇰🇪", defaultTimezone: "Africa/Nairobi" },
    USD: { code: "USD", symbol: "$", label: "USD (US Dollar)", rateFromKES: 0.00769, flag: "🇺🇸", defaultTimezone: "America/New_York" },
    EUR: { code: "EUR", symbol: "€", label: "EUR (Euro)", rateFromKES: 0.00704, flag: "🇪🇺", defaultTimezone: "Europe/Berlin" },
    GBP: { code: "GBP", symbol: "£", label: "GBP (British Pound)", rateFromKES: 0.00595, flag: "🇬🇧", defaultTimezone: "Europe/London" },
};

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (c: CurrencyCode) => void;
    currencyConfig: CurrencyConfig;
    convertPrice: (amountInKES: number) => number;
    formatCurrency: (amountInKES: number, compact?: boolean) => string;
    formatCurrencyFull: (amountInKES: number) => string;
    diasporaMode: boolean;
    setDiasporaMode: (enabled: boolean) => void;
    buyerTimezone: string;
    setBuyerTimezone: (tz: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const STORAGE_KEY = "estatevue_currency";
const DIASPORA_MODE_KEY = "estatevue_diaspora_mode";
const TIMEZONE_KEY = "estatevue_buyer_timezone";

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyCode>("KES");
    const [diasporaMode, setDiasporaModeState] = useState<boolean>(false);
    const [buyerTimezone, setBuyerTimezoneState] = useState<string>("Africa/Nairobi");

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
            if (saved && CURRENCIES[saved]) {
                setCurrencyState(saved);
            }

            const savedDiaspora = localStorage.getItem(DIASPORA_MODE_KEY);
            if (savedDiaspora !== null) {
                setDiasporaModeState(savedDiaspora === "true");
            } else if (saved && saved !== "KES") {
                setDiasporaModeState(true);
            }

            const savedTz = localStorage.getItem(TIMEZONE_KEY);
            if (savedTz) {
                setBuyerTimezoneState(savedTz);
            } else {
                const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (detected) {
                    setBuyerTimezoneState(detected);
                    if (detected !== "Africa/Nairobi" && savedDiaspora === null) {
                        setDiasporaModeState(true);
                    }
                }
            }
        } catch {
            // ignore storage/Intl errors in restricted environments
        }
    }, []);

    const setDiasporaMode = (enabled: boolean) => {
        setDiasporaModeState(enabled);
        try {
            localStorage.setItem(DIASPORA_MODE_KEY, String(enabled));
        } catch {
            // ignore localStorage write errors
        }
    };

    const setBuyerTimezone = (tz: string) => {
        setBuyerTimezoneState(tz);
        try {
            localStorage.setItem(TIMEZONE_KEY, tz);
        } catch {
            // ignore localStorage write errors
        }
    };

    const setCurrency = (c: CurrencyCode) => {
        setCurrencyState(c);
        try {
            localStorage.setItem(STORAGE_KEY, c);
        } catch {
            // ignore localStorage write errors
        }
        // Automatically enable Diaspora Concierge convenience when switching to foreign currency
        if (c !== "KES") {
            setDiasporaMode(true);
            if (buyerTimezone === "Africa/Nairobi") {
                setBuyerTimezone(CURRENCIES[c].defaultTimezone);
            }
        }
    };

    const currencyConfig = CURRENCIES[currency];

    const convertPrice = (amountInKES: number): number => {
        if (!amountInKES || isNaN(amountInKES)) return 0;
        return amountInKES * currencyConfig.rateFromKES;
    };

    const formatCurrency = (amountInKES: number, compact: boolean = true): string => {
        if (!amountInKES || isNaN(amountInKES)) return `${currencyConfig.symbol}0`;
        const converted = convertPrice(amountInKES);

        if (currency === "KES") {
            if (compact) {
                if (converted >= 1_000_000) {
                    return `KES ${(converted / 1_000_000).toFixed(1)}M`;
                }
                if (converted >= 1_000) {
                    return `KES ${(converted / 1_000).toFixed(0)}K`;
                }
            }
            return `KES ${Math.round(converted).toLocaleString()}`;
        }

        // Foreign currencies: USD, EUR, GBP
        const sym = currencyConfig.symbol;
        if (compact) {
            if (converted >= 1_000_000) {
                return `${sym}${(converted / 1_000_000).toFixed(2)}M`;
            }
            if (converted >= 1_000) {
                return `${sym}${(converted / 1_000).toFixed(1)}K`;
            }
        }
        return `${sym}${Math.round(converted).toLocaleString()}`;
    };

    const formatCurrencyFull = (amountInKES: number): string => {
        return formatCurrency(amountInKES, false);
    };

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                setCurrency,
                currencyConfig,
                convertPrice,
                formatCurrency,
                formatCurrencyFull,
                diasporaMode,
                setDiasporaMode,
                buyerTimezone,
                setBuyerTimezone,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        return {
            currency: "KES" as CurrencyCode,
            setCurrency: () => {},
            currencyConfig: CURRENCIES.KES,
            convertPrice: (n: number) => n,
            formatCurrency: (n: number) => `KES ${n.toLocaleString()}`,
            formatCurrencyFull: (n: number) => `KES ${n.toLocaleString()}`,
            diasporaMode: false,
            setDiasporaMode: () => {},
            buyerTimezone: "Africa/Nairobi",
            setBuyerTimezone: () => {},
        };
    }
    return context;
}
