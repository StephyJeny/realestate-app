"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { parseNaturalLanguageQuery, ParsedSmartQuery, SmartSearchChip } from "@/lib/smartSearch";
import styles from "./SmartSearchBar.module.css";

interface SmartSearchBarProps {
    initialQuery?: string;
    onParsedQueryChange?: (parsed: ParsedSmartQuery) => void;
    placeholder?: string;
    showSuggestions?: boolean;
    autoNavigateOnSubmit?: boolean;
}

const PROMPT_SUGGESTIONS = [
    "✨ 3BR villa in Karen with pool under 50M",
    "🌊 Ocean view in Nyali under 90M",
    "🏢 Westlands apartment under 30M",
    "🔑 2 bed to rent in Kilimani under 120k",
    "🌿 Land in Runda",
];

export default function SmartSearchBar({
    initialQuery = "",
    onParsedQueryChange,
    placeholder = "Search with AI... e.g. '3BR villa in Karen with pool under 50M'",
    showSuggestions = true,
    autoNavigateOnSubmit = false,
}: SmartSearchBarProps) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);
    const [dismissedChipIds, setDismissedChipIds] = useState<string[]>([]);

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    // Parse natural language query
    const parsed: ParsedSmartQuery = useMemo(() => {
        const rawParsed = parseNaturalLanguageQuery(query);
        // Filter out dismissed chips
        const activeChips = rawParsed.chips.filter(c => !dismissedChipIds.includes(c.id));
        return {
            ...rawParsed,
            chips: activeChips,
        };
    }, [query, dismissedChipIds]);

    // Notify parent if callback provided
    useEffect(() => {
        if (onParsedQueryChange) {
            onParsedQueryChange(parsed);
        }
    }, [parsed, onParsedQueryChange]);

    const handleSelectSuggestion = (suggestion: string) => {
        // Strip emoji
        const clean = suggestion.replace(/^[^\w]+/, "").trim();
        setQuery(clean);
        setDismissedChipIds([]);
    };

    const handleRemoveChip = (chipId: string) => {
        setDismissedChipIds(prev => [...prev, chipId]);
    };

    const handleClear = () => {
        setQuery("");
        setDismissedChipIds([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (autoNavigateOnSubmit) {
            const trimmed = query.trim();
            if (trimmed) {
                router.push(`/properties?smart=${encodeURIComponent(trimmed)}`);
            } else {
                router.push("/properties");
            }
        }
    };

    return (
        <div className={styles.smartSearchWrap}>
            <form onSubmit={handleSubmit}>
                <div className={`${styles.inputCard} ${isFocused ? styles.inputCardFocus : ""}`}>
                    <div className={styles.inputRow}>
                        <div className={styles.sparkleIcon}>
                            <span>✨</span>
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setDismissedChipIds([]);
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={placeholder}
                            className={styles.textInput}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className={styles.clearBtn}
                                aria-label="Clear search"
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                        <button type="submit" className={styles.submitBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <span>Search</span>
                        </button>
                    </div>

                    {/* Detected Criteria Chips */}
                    {parsed.chips.length > 0 && (
                        <div className={styles.chipsRow}>
                            <span className={styles.chipsLabel}>AI Understood:</span>
                            {parsed.chips.map((chip) => (
                                <span key={chip.id} className={styles.chip}>
                                    <span>{chip.icon}</span>
                                    <span>{chip.label}</span>
                                    <button
                                        type="button"
                                        className={styles.chipRemove}
                                        onClick={() => handleRemoveChip(chip.id)}
                                        title={`Remove ${chip.label}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </form>

            {/* Prompt Suggestions */}
            {showSuggestions && (
                <div className={styles.suggestionsRow}>
                    <span className={styles.suggestLabel}>Try asking:</span>
                    {PROMPT_SUGGESTIONS.map((s, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={styles.suggestPill}
                            onClick={() => handleSelectSuggestion(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
