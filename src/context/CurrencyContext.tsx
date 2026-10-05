"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CurrencyCode = "KES" | "USD" | "EUR" | "GBP";

export interface CurrencyConfig {
    code: CurrencyCode;
    symbol: string;
    label: string;
    rateFromKES: number; // Multiply KES amount by this rate
    flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    KES: { code: "KES", symbol: "KES ", label: "KES (Kenyan Shilling)", rateFromKES: 1, flag: "🇰🇪" },
    USD: { code: "USD", symbol: "$", label: "USD (US Dollar)", rateFromKES: 0.00769, flag: "🇺🇸" },
    EUR: { code: "EUR", symbol: "€", label: "EUR (Euro)", rateFromKES: 0.00704, flag: "🇪🇺" },
    GBP: { code: "GBP", symbol: "£", label: "GBP (British Pound)", rateFromKES: 0.00595, flag: "🇬🇧" },
};

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (c: CurrencyCode) => void;
    currencyConfig: CurrencyConfig;
    convertPrice: (amountInKES: number) => number;
    formatCurrency: (amountInKES: number, compact?: boolean) => string;
    formatCurrencyFull: (amountInKES: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const STORAGE_KEY = "estatevue_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyCode>("KES");

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
        if (saved && CURRENCIES[saved]) {
            setCurrencyState(saved);
        }
    }, []);

    const setCurrency = (c: CurrencyCode) => {
        setCurrencyState(c);
        try {
            localStorage.setItem(STORAGE_KEY, c);
        } catch {
            // ignore localStorage write errors
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
        };
    }
    return context;
}
