import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
    updateDoc,
    orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ========================
// SAVED SEARCH DATA MODEL
// ========================

export interface SavedSearchFilters {
    searchQuery?: string;
    propertyType?: string;
    listingType?: string;
    bedrooms?: string;
    bathrooms?: string;
    city?: string;
    neighborhood?: string;
    status?: string;
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
}

export interface SavedSearch {
    id?: string;
    userId: string;
    name: string;
    filters: SavedSearchFilters;
    matchCount?: number;
    lastChecked?: Timestamp;
    createdAt?: Timestamp;
    isActive: boolean;
}

// ========================
// CRUD OPERATIONS
// ========================

export async function createSavedSearch(
    userId: string,
    name: string,
    filters: SavedSearchFilters
): Promise<string> {
    const ref = await addDoc(collection(db, "savedSearches"), {
        userId,
        name,
        filters,
        matchCount: 0,
        isActive: true,
        lastChecked: serverTimestamp(),
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const q = query(
        collection(db, "savedSearches"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as SavedSearch[];
}

export async function deleteSavedSearch(searchId: string): Promise<void> {
    await deleteDoc(doc(db, "savedSearches", searchId));
}

export async function toggleSavedSearchActive(
    searchId: string,
    isActive: boolean
): Promise<void> {
    await updateDoc(doc(db, "savedSearches", searchId), { isActive });
}

export async function updateSavedSearchMatchCount(
    searchId: string,
    matchCount: number
): Promise<void> {
    await updateDoc(doc(db, "savedSearches", searchId), {
        matchCount,
        lastChecked: serverTimestamp(),
    });
}

// ========================
// FILTER DESCRIPTION HELPER
// ========================

export function describeFilters(filters: SavedSearchFilters): string {
    const parts: string[] = [];

    if (filters.listingType && filters.listingType !== "all") {
        parts.push(filters.listingType === "sale" ? "For Sale" : "For Rent");
    }
    if (filters.propertyType && filters.propertyType !== "All") {
        parts.push(filters.propertyType);
    }
    if (filters.bedrooms && filters.bedrooms !== "Any") {
        parts.push(`${filters.bedrooms} bed${filters.bedrooms === "1" ? "" : "s"}`);
    }
    if (filters.bathrooms && filters.bathrooms !== "Any") {
        parts.push(`${filters.bathrooms} bath${filters.bathrooms === "1" ? "" : "s"}`);
    }
    if (filters.city && filters.city !== "All") {
        parts.push(filters.city);
    }
    if (filters.neighborhood && filters.neighborhood !== "All") {
        parts.push(filters.neighborhood);
    }
    if (filters.priceMin && filters.priceMin > 0) {
        parts.push(`from KES ${formatNum(filters.priceMin)}`);
    }
    if (filters.priceMax && filters.priceMax < 200000000) {
        parts.push(`up to KES ${formatNum(filters.priceMax)}`);
    }
    if (filters.searchQuery) {
        parts.push(`"${filters.searchQuery}"`);
    }

    return parts.length > 0 ? parts.join(" · ") : "All properties";
}

function formatNum(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
}

// ========================
// MATCH CHECKER
// ========================

export function doesPropertyMatchSearch(
    property: {
        title?: string;
        description?: string;
        type?: string;
        listingType?: string;
        bedrooms?: number;
        bathrooms?: number;
        city?: string;
        neighborhood?: string;
        status?: string;
        price?: number;
        area?: number;
    },
    filters: SavedSearchFilters
): boolean {
    if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const searchable = [
            property.title,
            property.description,
            property.type,
            property.city,
            property.neighborhood,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        if (!searchable.includes(q)) return false;
    }

    if (filters.propertyType && filters.propertyType !== "All") {
        if (property.type?.toLowerCase() !== filters.propertyType.toLowerCase()) return false;
    }

    if (filters.listingType && filters.listingType !== "all") {
        if (property.listingType !== filters.listingType) return false;
    }

    if (filters.bedrooms && filters.bedrooms !== "Any") {
        const beds = parseInt(filters.bedrooms);
        if (filters.bedrooms === "5+" && (property.bedrooms || 0) < 5) return false;
        if (filters.bedrooms !== "5+" && property.bedrooms !== beds) return false;
    }

    if (filters.bathrooms && filters.bathrooms !== "Any") {
        const baths = parseInt(filters.bathrooms);
        if (filters.bathrooms === "4+" && (property.bathrooms || 0) < 4) return false;
        if (filters.bathrooms !== "4+" && property.bathrooms !== baths) return false;
    }

    if (filters.city && filters.city !== "All") {
        if (property.city !== filters.city) return false;
    }

    if (filters.neighborhood && filters.neighborhood !== "All") {
        if (property.neighborhood !== filters.neighborhood) return false;
    }

    if (filters.status && filters.status !== "all") {
        if (property.status !== filters.status) return false;
    }

    if (filters.priceMin && filters.priceMin > 0) {
        if ((property.price || 0) < filters.priceMin) return false;
    }

    if (filters.priceMax && filters.priceMax < 200000000) {
        if ((property.price || 0) > filters.priceMax) return false;
    }

    if (filters.areaMin) {
        if ((property.area || 0) < filters.areaMin) return false;
    }

    if (filters.areaMax) {
        if ((property.area || 0) > filters.areaMax) return false;
    }

    return true;
}
