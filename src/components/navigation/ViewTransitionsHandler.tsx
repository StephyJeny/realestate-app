"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * ViewTransitionsHandler
 * Activates the browser View Transitions API on internal navigation links,
 * allowing property cards, hero images, and page views to smoothly morph.
 */
export default function ViewTransitionsHandler() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === "undefined" || !("startViewTransition" in document)) {
            return;
        }

        const handleAnchorClick = (e: MouseEvent) => {
            // Find closest anchor tag
            const anchor = (e.target as HTMLElement)?.closest("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (
                !href ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                anchor.target === "_blank" ||
                anchor.hasAttribute("download")
            ) {
                return;
            }

            // Respect modifier keys for new tab / window
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) {
                return;
            }

            e.preventDefault();

            // Perform View Transition morph
            (document as any).startViewTransition(() => {
                router.push(href);
            });
        };

        // Capture clicks globally on document
        document.addEventListener("click", handleAnchorClick, { capture: true });

        // Handle browser Back / Forward buttons with View Transitions
        const handlePopState = () => {
            if ("startViewTransition" in document) {
                (document as any).startViewTransition(() => {});
            }
        };
        window.addEventListener("popstate", handlePopState);

        return () => {
            document.removeEventListener("click", handleAnchorClick, { capture: true });
            window.removeEventListener("popstate", handlePopState);
        };
    }, [router]);

    return null;
}
