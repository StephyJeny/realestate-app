import { Property } from "./data";

export interface SmartSearchChip {
    id: string;
    key: "location" | "type" | "listingType" | "price" | "bedrooms" | "amenity" | "keyword";
    label: string;
    icon: string;
    value: any;
}

export interface ParsedSmartQuery {
    rawQuery: string;
    city?: string;
    neighborhood?: string;
    propertyType?: "apartment" | "villa" | "house" | "townhouse" | "commercial" | "land";
    listingType?: "sale" | "rent";
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    amenities: string[];
    keywords: string[];
    chips: SmartSearchChip[];
}

const KENYAN_NEIGHBORHOODS = [
    { name: "Karen", city: "Nairobi" },
    { name: "Westlands", city: "Nairobi" },
    { name: "Kilimani", city: "Nairobi" },
    { name: "Runda", city: "Nairobi" },
    { name: "Kileleshwa", city: "Nairobi" },
    { name: "Lavington", city: "Nairobi" },
    { name: "South C", city: "Nairobi" },
    { name: "Langata", city: "Nairobi" },
    { name: "Kiambu Road", city: "Nairobi" },
    { name: "Syokimau", city: "Nairobi" },
    { name: "Nyali", city: "Mombasa" },
    { name: "Diani", city: "Mombasa" },
    { name: "Bamburi", city: "Mombasa" },
    { name: "Shanzu", city: "Mombasa" },
    { name: "Milimani", city: "Kisumu" },
    { name: "Riat", city: "Kisumu" },
];

const KENYAN_CITIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Malindi"];

export function parseNaturalLanguageQuery(text: string): ParsedSmartQuery {
    const rawQuery = text.trim();
    const lower = text.toLowerCase();
    const chips: SmartSearchChip[] = [];
    const amenities: string[] = [];
    const keywords: string[] = [];

    let city: string | undefined;
    let neighborhood: string | undefined;
    let propertyType: ParsedSmartQuery["propertyType"];
    let listingType: ParsedSmartQuery["listingType"];
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    let bedrooms: number | undefined;

    // 1. Detect Listing Type (Rent vs Buy/Sale)
    if (/\b(rent|rental|renting|to let|lease)\b/i.test(lower)) {
        listingType = "rent";
        chips.push({ id: "listingType-rent", key: "listingType", label: "For Rent", icon: "🔑", value: "rent" });
    } else if (/\b(buy|buying|sale|for sale|purchase)\b/i.test(lower)) {
        listingType = "sale";
        chips.push({ id: "listingType-sale", key: "listingType", label: "For Sale", icon: "🏷️", value: "sale" });
    }

    // 2. Detect Neighborhood & City
    for (const n of KENYAN_NEIGHBORHOODS) {
        const regex = new RegExp(`\\b${n.name}\\b`, "i");
        if (regex.test(lower)) {
            neighborhood = n.name;
            city = n.city;
            chips.push({
                id: `loc-${n.name}`,
                key: "location",
                label: `${n.name}, ${n.city}`,
                icon: "📍",
                value: n.name,
            });
            break;
        }
    }

    if (!city) {
        for (const c of KENYAN_CITIES) {
            const regex = new RegExp(`\\b${c}\\b`, "i");
            if (regex.test(lower)) {
                city = c;
                chips.push({ id: `city-${c}`, key: "location", label: c, icon: "📍", value: c });
                break;
            }
        }
    }

    // 3. Detect Property Type
    if (/\b(villa|villas)\b/i.test(lower)) {
        propertyType = "villa";
        chips.push({ id: "type-villa", key: "type", label: "Villa", icon: "🏛️", value: "villa" });
    } else if (/\b(apartment|apartments|flat|flats|condo|condos)\b/i.test(lower)) {
        propertyType = "apartment";
        chips.push({ id: "type-apartment", key: "type", label: "Apartment", icon: "🏢", value: "apartment" });
    } else if (/\b(townhouse|townhouses|maisonette)\b/i.test(lower)) {
        propertyType = "townhouse";
        chips.push({ id: "type-townhouse", key: "type", label: "Townhouse", icon: "🏘️", value: "townhouse" });
    } else if (/\b(house|houses|home|bungalow|mansion)\b/i.test(lower)) {
        propertyType = "house";
        chips.push({ id: "type-house", key: "type", label: "House", icon: "🏠", value: "house" });
    } else if (/\b(land|plot|acre|acres)\b/i.test(lower)) {
        propertyType = "land";
        chips.push({ id: "type-land", key: "type", label: "Land", icon: "🌿", value: "land" });
    } else if (/\b(commercial|office|shop)\b/i.test(lower)) {
        propertyType = "commercial";
        chips.push({ id: "type-commercial", key: "type", label: "Commercial", icon: "🏗️", value: "commercial" });
    }

    // 4. Detect Bedrooms
    // e.g. "3 bed", "3bed", "3 br", "3br", "3 bedroom", "3-bedroom", "studio"
    if (/\b(studio)\b/i.test(lower)) {
        bedrooms = 1;
        chips.push({ id: "beds-studio", key: "bedrooms", label: "Studio", icon: "🛏️", value: 1 });
    } else {
        const bedMatch = lower.match(/(\d+)\s*(?:beds?|bedrooms?|br\b)/i);
        if (bedMatch) {
            bedrooms = parseInt(bedMatch[1], 10);
            chips.push({ id: `beds-${bedrooms}`, key: "bedrooms", label: `${bedrooms} Bedrooms`, icon: "🛏️", value: bedrooms });
        }
    }

    // 5. Detect Price
    // Patterns: "under 40m", "under 40 million", "below 30m", "< 50m", "under 150k", "10m to 30m"
    const rangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:m|million|k)?\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(m|million|k)?/i);
    if (rangeMatch) {
        let minVal = parseFloat(rangeMatch[1]);
        let maxVal = parseFloat(rangeMatch[2]);
        const unit = (rangeMatch[3] || "").toLowerCase();

        if (unit.startsWith("m") || (!unit && maxVal < 500)) {
            minVal = minVal * 1000000;
            maxVal = maxVal * 1000000;
        } else if (unit === "k" || (!unit && maxVal >= 1000 && maxVal <= 900000)) {
            minVal = minVal * 1000;
            maxVal = maxVal * 1000;
        }

        minPrice = minVal;
        maxPrice = maxVal;
        chips.push({
            id: "price-range",
            key: "price",
            label: `KES ${(minVal >= 1000000 ? `${minVal / 1000000}M` : `${minVal / 1000}k`)} - ${(maxVal >= 1000000 ? `${maxVal / 1000000}M` : `${maxVal / 1000}k`)}`,
            icon: "💰",
            value: { min: minVal, max: maxVal },
        });
    } else {
        const maxMatch = lower.match(/(?:under|below|less than|max|up to|<)\s*(\d+(?:\.\d+)?)\s*(m|million|k)?/i);
        if (maxMatch) {
            let val = parseFloat(maxMatch[1]);
            const unit = (maxMatch[2] || "").toLowerCase();
            if (unit.startsWith("m") || (!unit && val < 500)) {
                val = val * 1000000;
            } else if (unit === "k" || (!unit && val >= 500)) {
                val = val * 1000;
            }
            maxPrice = val;
            chips.push({
                id: "price-max",
                key: "price",
                label: `Under KES ${val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : `${(val / 1000).toFixed(0)}k`}`,
                icon: "💰",
                value: val,
            });
        }
    }

    // 6. Detect Amenities & Descriptors
    const amenityMap: Record<string, { term: string; label: string; icon: string }> = {
        pool: { term: "Swimming Pool", label: "Pool", icon: "🏊" },
        "ocean view": { term: "Ocean View", label: "Ocean View", icon: "🌊" },
        "sea view": { term: "Ocean View", label: "Ocean View", icon: "🌊" },
        garden: { term: "Garden", label: "Garden", icon: "🌿" },
        gym: { term: "Gym", label: "Gym", icon: "🏋️" },
        security: { term: "24/7 Security", label: "24/7 Security", icon: "🛡️" },
        parking: { term: "Parking", label: "Parking", icon: "🚗" },
        "smart home": { term: "Smart Home", label: "Smart Home", icon: "🤖" },
        dsq: { term: "Staff Quarters", label: "Staff Quarters", icon: "🚪" },
        concierge: { term: "Concierge", label: "Concierge", icon: "🛎️" },
        elevator: { term: "Elevator", label: "Elevator", icon: "🛗" },
        rooftop: { term: "Rooftop Access", label: "Rooftop", icon: "🏙️" },
    };

    for (const [key, item] of Object.entries(amenityMap)) {
        if (lower.includes(key)) {
            amenities.push(item.term);
            chips.push({
                id: `amenity-${key}`,
                key: "amenity",
                label: item.label,
                icon: item.icon,
                value: item.term,
            });
        }
    }

    // 7. General descriptive keywords (e.g. airbnb, luxury, investment)
    if (lower.includes("airbnb")) {
        keywords.push("airbnb");
        chips.push({ id: "kw-airbnb", key: "keyword", label: "Airbnb Potential", icon: "📈", value: "airbnb" });
    }
    if (lower.includes("luxury")) {
        keywords.push("luxury");
        chips.push({ id: "kw-luxury", key: "keyword", label: "Luxury Tier", icon: "✨", value: "luxury" });
    }

    return {
        rawQuery,
        city,
        neighborhood,
        propertyType,
        listingType,
        minPrice,
        maxPrice,
        bedrooms,
        amenities,
        keywords,
        chips,
    };
}

export function filterPropertiesWithSmartQuery(properties: Property[], parsed: ParsedSmartQuery): Property[] {
    if (!parsed.chips.length && !parsed.rawQuery) return properties;

    return properties.filter((p) => {
        // Location filter
        if (parsed.neighborhood) {
            const pNeigh = typeof p.location === "object" ? p.location.neighborhood : (p as any).neighborhood || "";
            if (!pNeigh.toLowerCase().includes(parsed.neighborhood.toLowerCase())) {
                return false;
            }
        } else if (parsed.city) {
            const pCity = typeof p.location === "object" ? p.location.city : (p as any).city || "";
            if (!pCity.toLowerCase().includes(parsed.city.toLowerCase())) {
                return false;
            }
        }

        // Property type filter
        if (parsed.propertyType) {
            if (p.type.toLowerCase() !== parsed.propertyType.toLowerCase()) {
                return false;
            }
        }

        // Listing type (sale vs rent)
        if (parsed.listingType) {
            if (p.listingType !== parsed.listingType) {
                return false;
            }
        }

        // Bedrooms filter (at least requested number of bedrooms)
        if (parsed.bedrooms) {
            if (p.bedrooms < parsed.bedrooms) {
                return false;
            }
        }

        // Price filter
        if (parsed.minPrice !== undefined && p.price < parsed.minPrice) {
            return false;
        }
        if (parsed.maxPrice !== undefined && p.price > parsed.maxPrice) {
            return false;
        }

        // Amenities filter (if specified, property must contain requested amenities)
        if (parsed.amenities.length > 0) {
            const propAmenities = (p.amenities || []).map((a) => a.toLowerCase());
            const hasAll = parsed.amenities.every((req) =>
                propAmenities.some((pa) => pa.includes(req.toLowerCase()))
            );
            if (!hasAll) return false;
        }

        return true;
    });
}
