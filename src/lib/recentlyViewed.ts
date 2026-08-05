const STORAGE_KEY = "estatevue_recently_viewed";
const MAX_ITEMS = 10;

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
    } catch {
        // ignore
    }
}
