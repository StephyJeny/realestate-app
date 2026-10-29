import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { useDialogA11y } from "./useDialogA11y";

function Dialog({ onClose }: { onClose: () => void }) {
    const ref = useDialogA11y(true, onClose);
    return (
        <div ref={ref} role="dialog" aria-modal="true" aria-label="Test dialog">
            <button>First</button>
            <input aria-label="Middle" />
            <button>Last</button>
        </div>
    );
}

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button onClick={() => setOpen(true)}>Open dialog</button>
            {open && (
                <Dialog
                    onClose={() => {
                        onClose();
                        setOpen(false);
                    }}
                />
            )}
        </>
    );
}

// jsdom has no layout, so getClientRects() is empty and every element looks hidden.
// Give elements a non-empty rect list so the focusable-element filter works.
function mockLayout() {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
}

async function openDialog() {
    fireEvent.click(screen.getByText("Open dialog"));
    // focus is moved on the next tick
    await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
    });
}

describe("useDialogA11y", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        document.body.style.overflow = "";
    });

    it("moves focus to the first focusable element when opened", async () => {
        mockLayout();
        render(<Harness />);
        await openDialog();
        expect(document.activeElement).toBe(screen.getByText("First"));
    });

    it("closes on Escape and returns focus to the trigger", async () => {
        mockLayout();
        const onClose = vi.fn();
        render(<Harness onClose={onClose} />);
        const trigger = screen.getByText("Open dialog");
        trigger.focus();
        await openDialog();

        fireEvent.keyDown(document, { key: "Escape" });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it("wraps Tab from the last element to the first, and Shift+Tab back", async () => {
        mockLayout();
        render(<Harness />);
        await openDialog();

        const first = screen.getByText("First");
        const last = screen.getByText("Last");

        last.focus();
        fireEvent.keyDown(document, { key: "Tab" });
        expect(document.activeElement).toBe(first);

        fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
        expect(document.activeElement).toBe(last);
    });

    it("locks page scroll while open and restores it on close", async () => {
        mockLayout();
        render(<Harness />);
        await openDialog();
        expect(document.body.style.overflow).toBe("hidden");

        fireEvent.keyDown(document, { key: "Escape" });
        expect(document.body.style.overflow).toBe("");
    });
});
