const STORAGE_KEY = "estatevue_recently_viewed";
const MAX_ITEMS = 10;

/** Fired on `window` whenever the recently-viewed list changes in this tab. */
export const RECENTLY_VIEWED_EVENT = "estatevue:recently-viewed-changed";

function notifyChange() {
    try {
        window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
    } catch {
        // window not available (SSR)
    }
}

export interface RecentlyViewedItem {
    id: string;
    title: string;
    image: string;
    price: number;
    city: string;
    type: string;
    viewedAt: number;
}

export function addToRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">) {
    try {
        const existing = getRecentlyViewed();
        const filtered = existing.filter((i) => i.id !== item.id);
        const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        notifyChange();
    } catch {
        // localStorage not available (SSR)
    }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function clearRecentlyViewed() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        notifyChange();
    } catch {
        // ignore
    }
}
