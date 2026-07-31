export interface Property {
    id: string;
    title: string;
    slug: string;
    description: string;
    type: "apartment" | "house" | "villa" | "land" | "commercial" | "townhouse";
    listingType: "sale" | "rent";
    price: number;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    yearBuilt: number;
    address: string;
    location: {
        city: string;
        neighborhood: string;
    };
    amenities: string[];
    images: string[];
    agentName: string;
    agentImage: string;
    agentPhone: string;
    agentEmail: string;
    status: "active" | "pending" | "sold" | "rented";
    isFeatured: boolean;
    views: number;
    favorites: number;
    createdAt: string;
}

export const sampleProperties: Property[] = [
    {
        id: "1",
        title: "Modern Luxury Villa with Ocean Views",
        slug: "modern-luxury-villa-ocean-views",
        description: "Experience the pinnacle of coastal living in this breathtaking modern villa. Perched on a hillside overlooking the Indian Ocean, this architectural masterpiece features floor-to-ceiling windows that frame panoramic sea views. The open-plan living area flows seamlessly to an infinity pool and landscaped terraces. Premium finishes throughout include Italian marble, custom cabinetry, and smart home technology. The gourmet kitchen with top-of-the-line appliances is perfect for entertaining. Each bedroom suite offers en-suite bathrooms and private balconies. An absolute sanctuary of modern elegance.",
        type: "villa",
        listingType: "sale",
        price: 85000000,
        currency: "KES",
        bedrooms: 5,
        bathrooms: 4,
        area: 4200,
        yearBuilt: 2023,
        address: "12 Ocean Ridge Drive",
        location: { city: "Mombasa", neighborhood: "Nyali" },
        amenities: ["Swimming Pool", "Garden", "24/7 Security", "Parking", "Gym", "Smart Home", "Ocean View", "Staff Quarters"],
        images: ["/images/property-1.png", "/images/property-4.png", "/images/property-5.png"],
        agentName: "Sarah Kimani",
        agentImage: "/images/agent-avatar.png",
        agentPhone: "+254 712 345 678",
        agentEmail: "sarah@estatevue.com",
        status: "active",
        isFeatured: true,
        views: 1240,
        favorites: 89,
        createdAt: "2026-07-15",
    },
    {
        id: "2",
        title: "Elegant City Center Apartment",
        slug: "elegant-city-center-apartment",
        description: "A stunning high-rise apartment in the heart of Nairobi's vibrant Westlands district. This beautifully designed 3-bedroom unit offers contemporary urban living at its finest. Floor-to-ceiling windows provide breathtaking city skyline views, while the open-concept layout creates a spacious, airy feel. Features include a modern kitchen with granite countertops, spacious living and dining areas, and a private balcony perfect for morning coffee. Building amenities include a rooftop pool, fitness center, and 24-hour concierge service.",
        type: "apartment",
        listingType: "sale",
        price: 25000000,
        currency: "KES",
        bedrooms: 3,
        bathrooms: 2,
        area: 1800,
        yearBuilt: 2024,
        address: "Westlands Tower, 5th Floor",
        location: { city: "Nairobi", neighborhood: "Westlands" },
        amenities: ["Parking", "Gym", "Swimming Pool", "Concierge", "Elevator", "Rooftop Access"],
        images: ["/images/property-2.png", "/images/property-4.png"],
        agentName: "Sarah Kimani",
        agentImage: "/images/agent-avatar.png",
        agentPhone: "+254 712 345 678",
        agentEmail: "sarah@estatevue.com",
        status: "active",
        isFeatured: true,
        views: 890,
        favorites: 67,
        createdAt: "2026-07-20",
    },
    {
        id: "3",
        title: "Charming Family Townhouse in Karen",
        slug: "charming-family-townhouse-karen",
        description: "Nestled in the leafy suburb of Karen, this charming 4-bedroom townhouse offers the perfect blend of suburban tranquility and modern convenience. Set within a gated community with mature gardens, the property features spacious living areas, a modern kitchen, and a private garden. The master bedroom includes a walk-in closet and en-suite bathroom. Located minutes from Karen shopping centers, international schools, and the Nairobi National Park.",
        type: "townhouse",
        listingType: "sale",
        price: 42000000,
        currency: "KES",
        bedrooms: 4,
        bathrooms: 3,
        area: 2800,
        yearBuilt: 2021,
        address: "Karen Ridge Estate",
        location: { city: "Nairobi", neighborhood: "Karen" },
        amenities: ["Garden", "Parking", "Security", "Playground", "CCTV", "Borehole"],
        images: ["/images/property-3.png", "/images/property-1.png"],
        agentName: "Sarah Kimani",
        agentImage: "/images/agent-avatar.png",
        agentPhone: "+254 712 345 678",
        agentEmail: "sarah@estatevue.com",
        status: "active",
        isFeatured: true,
        views: 650,
        favorites: 45,
        createdAt: "2026-07-18",
    },
    {
        id: "4",
        title: "Luxury Penthouse with Skyline Views",
        slug: "luxury-penthouse-skyline-views",
        description: "Indulge in the ultimate urban luxury with this stunning penthouse apartment. Occupying the entire top floor, this residence offers unrivaled 360-degree views of the Nairobi skyline. Features include a private rooftop terrace, floor-to-ceiling windows, designer interiors with imported furnishings, and a state-of-the-art kitchen. Two dedicated parking spaces and a private elevator entrance ensure exclusive access.",
        type: "apartment",
        listingType: "rent",
        price: 350000,
        currency: "KES",
        bedrooms: 3,
        bathrooms: 3,
        area: 2500,
        yearBuilt: 2025,
        address: "Kilimani Heights, Penthouse",
        location: { city: "Nairobi", neighborhood: "Kilimani" },
        amenities: ["Rooftop Terrace", "Private Elevator", "Gym", "Concierge", "Smart Home", "Wine Cellar"],
        images: ["/images/property-4.png", "/images/property-2.png"],
        agentName: "Sarah Kimani",
        agentImage: "/images/agent-avatar.png",
        agentPhone: "+254 712 345 678",
        agentEmail: "sarah@estatevue.com",
        status: "active",
        isFeatured: false,
        views: 1100,
        favorites: 92,
        createdAt: "2026-07-22",
    },
    {
        id: "5",
        title: "Mediterranean Villa with Private Pool",
        slug: "mediterranean-villa-private-pool",
        description: "A stunning Mediterranean-inspired villa featuring warm terracotta tones, arched doorways, and lush tropical gardens. This 6-bedroom estate includes a resort-style swimming pool, outdoor entertainment area, and beautifully manicured grounds. The interior boasts high ceilings, handcrafted tilework, and spacious living areas filled with natural light. Staff quarters and ample parking complete this magnificent property.",
        type: "villa",
        listingType: "sale",
        price: 120000000,
        currency: "KES",
        bedrooms: 6,
        bathrooms: 5,
        area: 5500,
        yearBuilt: 2020,
        address: "Runda Paradise Estate",
        location: { city: "Nairobi", neighborhood: "Runda" },
        amenities: ["Swimming Pool", "Garden", "Staff Quarters", "Security", "Parking", "BBQ Area", "Tennis Court"],
        images: ["/images/property-5.png", "/images/property-1.png"],
        agentName: "Sarah Kimani",
        agentImage: "/images/agent-avatar.png",
        agentPhone: "+254 712 345 678",
        agentEmail: "sarah@estatevue.com",
        status: "active",
        isFeatured: false,
        views: 780,
        favorites: 56,
        createdAt: "2026-07-10",
    },
    {
        id: "6",
        title: "Contemporary Eco-Friendly Home",
        slug: "contemporary-eco-friendly-home",
        description: "A cutting-edge contemporary home built with sustainability in mind. This eco-friendly residence features solar panels, rainwater harvesting, and passive cooling design. The open-plan living spaces are bathed in natural light through expansive glass walls. A green roof, native landscaping, and an organic vegetable garden complement the eco-conscious design. Smart home automation throughout ensures energy efficiency.",
        type: "house",
        listingType: "sale",
        price: 55000000,
        currency: "KES",
        bedrooms: 4,
        bathrooms: 3,
        area: 3200,
        yearBuilt: 2024,
        address: "Green Valley Estate",
        location: { city: "Nairobi", neighborhood: "Kitisuru" },
        amenities: ["Solar Panels", "Garden", "Smart Home", "Parking", "Rainwater Harvesting", "EV Charging"],
        images: ["/images/property-6.png", "/images/property-3.png"],
        agentName: "Sarah Kimani",
        agentImage: "/images/agent-avatar.png",
        agentPhone: "+254 712 345 678",
        agentEmail: "sarah@estatevue.com",
        status: "active",
        isFeatured: false,
        views: 430,
        favorites: 38,
        createdAt: "2026-07-25",
    },
];

export function formatPrice(price: number, currency: string = "KES"): string {
    if (currency === "KES") {
        if (price >= 1000000) {
            return `KES ${(price / 1000000).toFixed(1)}M`;
        }
        return `KES ${price.toLocaleString()}`;
    }
    return `$${price.toLocaleString()}`;
}

export function formatPriceFull(price: number, currency: string = "KES"): string {
    if (currency === "KES") {
        return `KES ${price.toLocaleString()}`;
    }
    return `$${price.toLocaleString()}`;
}
