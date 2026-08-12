/* =====================================================
   SHARED NEIGHBORHOOD DATA
   Extracted so both the listing page and detail pages
   can reference the same data.
   ===================================================== */

export interface NearbyPlace {
    name: string;
    icon: string;
    type: string;
}

export interface NeighborhoodData {
    id: string;
    name: string;
    city: string;
    tagline: string;
    description: string;
    image: string;
    badge?: "popular" | "trending" | "upcoming";
    avgPrice: string;
    priceRange: string;
    propertyCount: number;
    safetyRating: number;
    walkabilityScore: number;
    transitScore: number;
    lifestyleScore: number;
    vibes: string[];
    nearbySchools: NearbyPlace[];
    nearbyHospitals: NearbyPlace[];
    nearbyShopping: NearbyPlace[];
    nearbyDining: NearbyPlace[];
    nearbyParks: NearbyPlace[];
}

export const neighborhoods: NeighborhoodData[] = [
    {
        id: "karen",
        name: "Karen",
        city: "Nairobi",
        tagline: "Leafy suburbia with a village charm",
        description:
            "Karen is one of Nairobi's most prestigious and spacious suburbs, named after Karen Blixen of 'Out of Africa' fame. Known for its lush green landscapes, large compound homes, and equestrian culture, it offers a serene escape from the city buzz while remaining well-connected to the CBD. The area attracts families seeking top-notch international schools, nature lovers, and those who appreciate sprawling gardens and mature trees. Karen's property market features grand villas, gated communities, and contemporary townhouses set amid beautifully landscaped grounds.",
        image: "/images/property-3.png",
        badge: "popular",
        avgPrice: "KES 42M",
        priceRange: "KES 15M – 120M",
        propertyCount: 48,
        safetyRating: 9,
        walkabilityScore: 4,
        transitScore: 5,
        lifestyleScore: 8,
        vibes: ["Family-Friendly", "Suburban", "Nature", "Equestrian", "Quiet", "Premium"],
        nearbySchools: [
            { name: "Brookhouse School", icon: "🎓", type: "International" },
            { name: "Banda School", icon: "🎓", type: "Primary" },
            { name: "Karen C Daycare", icon: "👶", type: "Early Childhood" },
        ],
        nearbyHospitals: [
            { name: "Karen Hospital", icon: "🏥", type: "Private Hospital" },
            { name: "Coptic Hospital Karen", icon: "🏥", type: "Specialist" },
        ],
        nearbyShopping: [
            { name: "Karen Hub", icon: "🛒", type: "Mall" },
            { name: "The Karen Hardy", icon: "🛍️", type: "Shopping Center" },
            { name: "Karen Crossroads", icon: "🏪", type: "Shops" },
        ],
        nearbyDining: [
            { name: "Talisman", icon: "🍽️", type: "Fine Dining" },
            { name: "Karen Blixen Coffee Garden", icon: "☕", type: "Café" },
            { name: "Harvest Restaurant", icon: "🍕", type: "International" },
        ],
        nearbyParks: [
            { name: "Nairobi National Park", icon: "🦁", type: "Wildlife" },
            { name: "Giraffe Centre", icon: "🦒", type: "Attraction" },
            { name: "Karen Country Club", icon: "⛳", type: "Recreation" },
        ],
    },
    {
        id: "westlands",
        name: "Westlands",
        city: "Nairobi",
        tagline: "The heartbeat of urban Nairobi",
        description:
            "Westlands is Nairobi's premier commercial and lifestyle hub. Home to gleaming skyscrapers, world-class restaurants, vibrant nightlife, and major corporate headquarters, it's the neighborhood of choice for young professionals and cosmopolitan residents. The area has undergone massive transformation with modern high-rise apartments, serviced offices, and mixed-use developments. Excellent public transport links, proximity to the Westgate and Sarit Centre malls, and a thriving food scene make Westlands one of the most sought-after urban addresses in Kenya.",
        image: "/images/property-2.png",
        badge: "trending",
        avgPrice: "KES 25M",
        priceRange: "KES 8M – 65M",
        propertyCount: 72,
        safetyRating: 7,
        walkabilityScore: 8,
        transitScore: 9,
        lifestyleScore: 9,
        vibes: ["Urban", "Cosmopolitan", "Nightlife", "Business Hub", "Walkable", "Modern"],
        nearbySchools: [
            { name: "Aga Khan Academy", icon: "🎓", type: "International" },
            { name: "Hospital Hill School", icon: "🎓", type: "Public" },
        ],
        nearbyHospitals: [
            { name: "Aga Khan University Hospital", icon: "🏥", type: "University Hospital" },
            { name: "MP Shah Hospital", icon: "🏥", type: "Private" },
        ],
        nearbyShopping: [
            { name: "Sarit Centre", icon: "🛒", type: "Mall" },
            { name: "Westgate Mall", icon: "🛍️", type: "Premium Mall" },
            { name: "The Mall Westlands", icon: "🏪", type: "Shopping" },
        ],
        nearbyDining: [
            { name: "Artcaffe Westlands", icon: "☕", type: "Café & Bistro" },
            { name: "Mama Rocks", icon: "🍔", type: "Burgers & Grill" },
            { name: "Ocean Basket", icon: "🐟", type: "Seafood" },
        ],
        nearbyParks: [
            { name: "Karura Forest", icon: "🌿", type: "Nature Reserve" },
            { name: "City Park", icon: "🌳", type: "Public Park" },
        ],
    },
    {
        id: "kilimani",
        name: "Kilimani",
        city: "Nairobi",
        tagline: "Where convenience meets modern living",
        description:
            "Kilimani has rapidly evolved into one of Nairobi's most desirable residential neighborhoods. Centrally located between the CBD and Westlands, it offers the perfect balance of urban convenience and residential calm. The area is characterized by tree-lined streets, modern apartment complexes, and proximity to Yaya Centre and Prestige Plaza. Popular with diplomats, expats, and young families, Kilimani boasts excellent restaurants, boutique shops, and cultural venues. Its central location means quick access to everything the city has to offer.",
        image: "/images/property-4.png",
        badge: "popular",
        avgPrice: "KES 18M",
        priceRange: "KES 6M – 55M",
        propertyCount: 85,
        safetyRating: 8,
        walkabilityScore: 7,
        transitScore: 8,
        lifestyleScore: 8,
        vibes: ["Central", "Diplomatic", "Modern", "Restaurants", "Convenient", "Diverse"],
        nearbySchools: [
            { name: "Kilimani Junior Academy", icon: "🎓", type: "Primary" },
            { name: "Rusinga School", icon: "🎓", type: "International" },
        ],
        nearbyHospitals: [
            { name: "Nairobi Hospital", icon: "🏥", type: "Premier Hospital" },
            { name: "Avenue Healthcare", icon: "🏥", type: "Multi-branch" },
        ],
        nearbyShopping: [
            { name: "Yaya Centre", icon: "🛒", type: "Mall" },
            { name: "Prestige Plaza", icon: "🛍️", type: "Shopping" },
            { name: "AdLife Plaza", icon: "🏪", type: "Shopping" },
        ],
        nearbyDining: [
            { name: "About Thyme", icon: "🍽️", type: "Fine Dining" },
            { name: "Java House Kilimani", icon: "☕", type: "Café" },
            { name: "Zen Garden", icon: "🍜", type: "Asian Fusion" },
        ],
        nearbyParks: [
            { name: "Uhuru Gardens", icon: "🌿", type: "Memorial Park" },
        ],
    },
    {
        id: "runda",
        name: "Runda",
        city: "Nairobi",
        tagline: "The ambassador's choice — elite living",
        description:
            "Runda is Nairobi's most exclusive residential enclave, home to ambassadorial residences, CEO mansions, and ultra-high-net-worth individuals. Known for its tree-lined avenues, expansive compounds, and impeccable security, Runda offers unmatched privacy and prestige. Properties here feature sprawling gardens, swimming pools, tennis courts, and staff quarters as standard. The neighborhood is served by top-tier international schools and is conveniently close to Village Market and UN headquarters.",
        image: "/images/property-5.png",
        avgPrice: "KES 120M",
        priceRange: "KES 50M – 500M+",
        propertyCount: 24,
        safetyRating: 10,
        walkabilityScore: 3,
        transitScore: 4,
        lifestyleScore: 9,
        vibes: ["Ultra-Premium", "Diplomatic", "Exclusive", "Private", "Secure", "Prestigious"],
        nearbySchools: [
            { name: "ISK (International School of Kenya)", icon: "🎓", type: "International" },
            { name: "Rosslyn Academy", icon: "🎓", type: "International" },
        ],
        nearbyHospitals: [
            { name: "Gertrude's Hospital Muthaiga", icon: "🏥", type: "Children's" },
            { name: "Aga Khan Hospital", icon: "🏥", type: "University Hospital" },
        ],
        nearbyShopping: [
            { name: "Village Market", icon: "🛒", type: "Premium Mall" },
            { name: "Rosslyn Riviera", icon: "🛍️", type: "Mall" },
        ],
        nearbyDining: [
            { name: "Osteria del Chianti", icon: "🍝", type: "Italian" },
            { name: "Pampa Churrascos", icon: "🥩", type: "Steakhouse" },
        ],
        nearbyParks: [
            { name: "Karura Forest", icon: "🌿", type: "Nature Reserve" },
            { name: "UN Complex Grounds", icon: "🌳", type: "Green Space" },
        ],
    },
    {
        id: "nyali",
        name: "Nyali",
        city: "Mombasa",
        tagline: "Coastal luxury with ocean breezes",
        description:
            "Nyali is Mombasa's most prestigious residential area, stretching along the stunning Indian Ocean coastline. This upscale neighborhood is famous for its beautiful beaches, luxury resorts, and vibrant nightlife. Properties range from beachfront villas with private pools to modern apartments with ocean views. The area offers excellent international schools, world-class hospitals, and the popular Nyali Centre for shopping. With its tropical climate, swaying palm trees, and laid-back coastal lifestyle, Nyali represents the best of Kenya's beach living.",
        image: "/images/property-1.png",
        badge: "trending",
        avgPrice: "KES 85M",
        priceRange: "KES 20M – 200M",
        propertyCount: 35,
        safetyRating: 8,
        walkabilityScore: 6,
        transitScore: 5,
        lifestyleScore: 9,
        vibes: ["Beachfront", "Tropical", "Resort-Style", "Investment", "Ocean Views", "Relaxed"],
        nearbySchools: [
            { name: "Aga Khan Academy Mombasa", icon: "🎓", type: "International" },
            { name: "Light Academy", icon: "🎓", type: "Private" },
        ],
        nearbyHospitals: [
            { name: "Aga Khan Hospital Mombasa", icon: "🏥", type: "University Hospital" },
            { name: "Pandya Memorial Hospital", icon: "🏥", type: "Private" },
        ],
        nearbyShopping: [
            { name: "Nyali Centre", icon: "🛒", type: "Mall" },
            { name: "City Mall Nyali", icon: "🛍️", type: "Mall" },
        ],
        nearbyDining: [
            { name: "Tamarind Restaurant", icon: "🍽️", type: "Seafood Fine Dining" },
            { name: "Moorings", icon: "🌊", type: "Waterfront Dining" },
            { name: "Café Mocha", icon: "☕", type: "Café" },
        ],
        nearbyParks: [
            { name: "Nyali Beach", icon: "🏖️", type: "Beach" },
            { name: "Haller Park", icon: "🦋", type: "Nature & Wildlife" },
            { name: "Mombasa Marine Park", icon: "🐠", type: "Marine Reserve" },
        ],
    },
    {
        id: "kitisuru",
        name: "Kitisuru",
        city: "Nairobi",
        tagline: "Eco-conscious living in green serenity",
        description:
            "Kitisuru is a serene, upscale suburb nestled in Nairobi's lush northern corridor. Known for its quiet streets, abundant greenery, and proximity to Karura Forest, it attracts nature lovers and environmentally conscious residents. The neighborhood has seen a surge in modern, eco-friendly developments featuring solar panels, rainwater harvesting, and sustainable architecture. Kitisuru offers a perfect blend of suburban tranquility and convenient access to Westlands and the UN area.",
        image: "/images/property-6.png",
        badge: "upcoming",
        avgPrice: "KES 55M",
        priceRange: "KES 25M – 100M",
        propertyCount: 31,
        safetyRating: 9,
        walkabilityScore: 4,
        transitScore: 5,
        lifestyleScore: 7,
        vibes: ["Eco-Friendly", "Green Living", "Suburban", "Family", "Quiet", "Sustainable"],
        nearbySchools: [
            { name: "Peponi School", icon: "🎓", type: "Private" },
            { name: "Brookhouse Runda", icon: "🎓", type: "International" },
        ],
        nearbyHospitals: [
            { name: "Gertrude's Hospital", icon: "🏥", type: "Children's Hospital" },
            { name: "AAR Hospital", icon: "🏥", type: "Private" },
        ],
        nearbyShopping: [
            { name: "Village Market", icon: "🛒", type: "Mall" },
            { name: "Two Rivers Mall", icon: "🛍️", type: "Mega Mall" },
        ],
        nearbyDining: [
            { name: "Lord Erroll", icon: "🍽️", type: "Fine Dining" },
            { name: "Zen Garden", icon: "🍜", type: "Japanese" },
        ],
        nearbyParks: [
            { name: "Karura Forest", icon: "🌿", type: "Nature Reserve" },
            { name: "Kitisuru Forest", icon: "🌳", type: "Green Space" },
        ],
    },
    {
        id: "lavington",
        name: "Lavington",
        city: "Nairobi",
        tagline: "Upscale living in the city's green belt",
        description:
            "Lavington is a prestigious, tree-lined residential area that strikes the perfect balance between luxury and accessibility. Favored by diplomats, senior executives, and established families, the neighborhood features beautiful colonial-era homes alongside sleek modern developments. Its central position provides easy access to both the CBD and the western suburbs. The area is known for its excellent security, mature gardens, and proximity to top schools and healthcare facilities.",
        image: "/images/property-2.png",
        avgPrice: "KES 35M",
        priceRange: "KES 12M – 80M",
        propertyCount: 56,
        safetyRating: 8,
        walkabilityScore: 6,
        transitScore: 7,
        lifestyleScore: 8,
        vibes: ["Upscale", "Central", "Green Belt", "Diplomatic", "Established", "Secure"],
        nearbySchools: [
            { name: "Braeburn School", icon: "🎓", type: "International" },
            { name: "Lavington Primary", icon: "🎓", type: "Public" },
        ],
        nearbyHospitals: [
            { name: "Nairobi Women's Hospital", icon: "🏥", type: "Women's Health" },
            { name: "Kenyatta National Hospital", icon: "🏥", type: "Public" },
        ],
        nearbyShopping: [
            { name: "Lavington Mall", icon: "🛒", type: "Mall" },
            { name: "Valley Arcade", icon: "🛍️", type: "Shopping Center" },
        ],
        nearbyDining: [
            { name: "Artcaffe Lavington", icon: "☕", type: "Café & Bistro" },
            { name: "Caramel Restaurant", icon: "🍽️", type: "Fine Dining" },
        ],
        nearbyParks: [
            { name: "Lavington Green", icon: "🌳", type: "Park" },
        ],
    },
    {
        id: "diani",
        name: "Diani Beach",
        city: "Mombasa",
        tagline: "Africa's award-winning beach paradise",
        description:
            "Diani Beach, consistently voted Africa's leading beach destination, offers an unparalleled coastal lifestyle. Located south of Mombasa along the Kenyan coast, its pristine white-sand beaches, turquoise waters, and world-class resorts make it a dream location for both residents and investors. The area has seen significant development in luxury beachfront properties, boutique hotels, and eco-resorts. Diani is popular with international buyers seeking holiday homes, retirement properties, and rental income opportunities.",
        image: "/images/property-1.png",
        badge: "trending",
        avgPrice: "KES 65M",
        priceRange: "KES 15M – 180M",
        propertyCount: 22,
        safetyRating: 7,
        walkabilityScore: 5,
        transitScore: 4,
        lifestyleScore: 10,
        vibes: ["Beach Paradise", "Resort Living", "Investment", "Eco-Tourism", "Water Sports", "Tropical"],
        nearbySchools: [
            { name: "Diani International School", icon: "🎓", type: "International" },
        ],
        nearbyHospitals: [
            { name: "Diani Beach Hospital", icon: "🏥", type: "Private" },
        ],
        nearbyShopping: [
            { name: "Diani Beach Shopping Centre", icon: "🛒", type: "Mall" },
            { name: "Nakumatt Diani", icon: "🛍️", type: "Supermarket" },
        ],
        nearbyDining: [
            { name: "Ali Barbour's Cave", icon: "🍽️", type: "Cave Restaurant" },
            { name: "Sails Beach Bar", icon: "🌊", type: "Beach Bar" },
            { name: "Nomad Beach Bar", icon: "🍹", type: "Beachfront" },
        ],
        nearbyParks: [
            { name: "Diani Beach", icon: "🏖️", type: "Beach" },
            { name: "Colobus Conservation", icon: "🐒", type: "Wildlife" },
            { name: "Shimba Hills Reserve", icon: "🌿", type: "Nature Reserve" },
        ],
    },
];

export function getNeighborhoodById(id: string): NeighborhoodData | undefined {
    return neighborhoods.find((n) => n.id === id);
}
