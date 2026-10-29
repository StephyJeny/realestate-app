import { beforeEach, describe, expect, it, vi } from "vitest";
import { addToRecentlyViewed, clearRecentlyViewed, getRecentlyViewed, RECENTLY_VIEWED_EVENT } from "./recentlyViewed";

const item = (id: string) => ({ id, title: `Home ${id}`, image: "/x.png", price: 1_000_000, city: "Nairobi", type: "house" });

describe("recentlyViewed", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("puts the latest view first and removes duplicates", () => {
        addToRecentlyViewed(item("a"));
        addToRecentlyViewed(item("b"));
        addToRecentlyViewed(item("a"));
        expect(getRecentlyViewed().map((i) => i.id)).toEqual(["a", "b"]);
    });

    it("keeps at most 10 items", () => {
        for (let i = 0; i < 15; i++) addToRecentlyViewed(item(String(i)));
        const ids = getRecentlyViewed().map((i) => i.id);
        expect(ids).toHaveLength(10);
        expect(ids[0]).toBe("14");
        expect(ids).not.toContain("4");
    });

    it("fires a same-tab change event on add and clear (replaces the old 2s polling)", () => {
        const listener = vi.fn();
        window.addEventListener(RECENTLY_VIEWED_EVENT, listener);
        addToRecentlyViewed(item("a"));
        clearRecentlyViewed();
        window.removeEventListener(RECENTLY_VIEWED_EVENT, listener);
        expect(listener).toHaveBeenCalledTimes(2);
        expect(getRecentlyViewed()).toEqual([]);
    });

    it("returns an empty list when storage holds corrupt data", () => {
        localStorage.setItem("estatevue_recently_viewed", "{not json");
        expect(getRecentlyViewed()).toEqual([]);
    });
});
