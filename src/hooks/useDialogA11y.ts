"use client";
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "iframe",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true" && el.getClientRects().length > 0
    );
}

/** Number of dialogs currently open, so nested dialogs don't unlock scrolling early. */
let openDialogCount = 0;

/**
 * Accessible modal dialog behaviour:
 * - moves focus into the dialog when it opens and restores it to the trigger on close
 * - keeps Tab / Shift+Tab focus inside the dialog
 * - closes on Escape
 * - locks background page scroll while open
 *
 * Attach the returned ref to the dialog panel (the element that should own focus),
 * and give that element `role="dialog"` and `aria-modal="true"`.
 */
export function useDialogA11y<T extends HTMLElement = HTMLDivElement>(isOpen: boolean, onClose: () => void) {
    const dialogRef = useRef<T>(null);
    // Keep the latest onClose without re-running the effect on every render
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const dialog = dialogRef.current;
        if (!dialog) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;

        // Move focus inside: first focusable element, otherwise the panel itself
        const focusFirst = () => {
            const [first] = getFocusable(dialog);
            if (first) {
                first.focus();
            } else {
                if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
                dialog.focus();
            }
        };
        const focusTimer = window.setTimeout(focusFirst, 0);

        // Scroll lock (reference-counted for nested dialogs)
        openDialogCount += 1;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = getFocusable(dialog);
            if (focusable.length === 0) {
                event.preventDefault();
                dialog.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === first || !dialog.contains(active))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);
            openDialogCount = Math.max(0, openDialogCount - 1);
            if (openDialogCount === 0) document.body.style.overflow = previousOverflow;
            // Return focus to whatever opened the dialog
            if (previouslyFocused && typeof previouslyFocused.focus === "function" && document.contains(previouslyFocused)) {
                previouslyFocused.focus();
            }
        };
    }, [isOpen]);

    return dialogRef;
}
