"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface CompareContextType {
    compareIds: string[];
    addToCompare: (id: string) => void;
    removeFromCompare: (id: string) => void;
    toggleCompare: (id: string) => void;
    isInCompare: (id: string) => boolean;
    clearCompare: () => void;
    compareCount: number;
    maxCompare: number;
}

const CompareContext = createContext<CompareContextType | null>(null);

const MAX_COMPARE = 4;
const STORAGE_KEY = "estatevue_compare";

export function CompareProvider({ children }: { children: ReactNode }) {
    const [compareIds, setCompareIds] = useState<string[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) setCompareIds(parsed.slice(0, MAX_COMPARE));
            }
        } catch { }
    }, []);

    // Sync to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
        } catch { }
    }, [compareIds]);

    const addToCompare = useCallback((id: string) => {
        setCompareIds((prev) => {
            if (prev.includes(id) || prev.length >= MAX_COMPARE) return prev;
            return [...prev, id];
        });
    }, []);

    const removeFromCompare = useCallback((id: string) => {
        setCompareIds((prev) => prev.filter((x) => x !== id));
    }, []);

    const toggleCompare = useCallback((id: string) => {
        setCompareIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= MAX_COMPARE) return prev;
            return [...prev, id];
        });
    }, []);

    const isInCompare = useCallback(
        (id: string) => compareIds.includes(id),
        [compareIds]
    );

    const clearCompare = useCallback(() => setCompareIds([]), []);

    return (
        <CompareContext.Provider
            value={{
                compareIds,
                addToCompare,
                removeFromCompare,
                toggleCompare,
                isInCompare,
                clearCompare,
                compareCount: compareIds.length,
                maxCompare: MAX_COMPARE,
            }}
        >
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const ctx = useContext(CompareContext);
    if (!ctx) throw new Error("useCompare must be used within CompareProvider");
    return ctx;
}
