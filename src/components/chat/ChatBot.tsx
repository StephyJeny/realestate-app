"use client";
import { useState, useRef, useEffect } from "react";
import { sampleProperties, Property, formatPrice } from "@/lib/data";
import { getAllProperties, FirestoreProperty } from "@/lib/firestore";
import styles from "./ChatBot.module.css";

interface Message {
    id: string;
    text: string;
    sender: "bot" | "user";
    timestamp: Date;
    options?: QuickOption[];
    properties?: PropertyResult[];
}

interface QuickOption {
    label: string;
    value: string;
}

interface PropertyResult {
    id: string;
    title: string;
    price: number;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    location: string;
    type: string;
    listingType: string;
    image: string;
}

const INITIAL_OPTIONS: QuickOption[] = [
    { label: "🏠 Buying a property", value: "I want to buy a property" },
    { label: "🔑 Renting a property", value: "I want to rent a property" },
    { label: "💰 Property pricing", value: "What are the property prices?" },
    { label: "🔍 Search properties", value: "search_properties" },
    { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
    { label: "📋 How it works", value: "How does the process work?" },
];

const AI_RESPONSES: Record<string, { text: string; options?: QuickOption[] }> = {
    "greeting": {
        text: "Hello! 😊 Welcome to EstateVue! I'm your AI property assistant.\n\nI can help you with buying, renting, pricing info, finding locations, or connecting you with an agent.\n\nI can also **search our live listings** for you! Just tell me what you're looking for.\n\nWhat are you looking for today?",
        options: INITIAL_OPTIONS,
    },
    "buy": {
        text: "Great choice! 🏠 We have a wide selection of properties for sale across Kenya. You can:\n\n• Browse our listings at the Properties page\n• Filter by location, price, bedrooms, and property type\n• Schedule viewings directly with our agents\n\nWant me to search for something specific? Just say something like \"3 bedroom apartment in Kilimani\" or pick an option below:",
        options: [
            { label: "📍 Nairobi properties", value: "I'm looking for properties in Nairobi" },
            { label: "🌊 Mombasa properties", value: "I'm looking for properties in Mombasa" },
            { label: "🔍 Search properties", value: "search_properties" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
        ],
    },
    "rent": {
        text: "We'd love to help you find the perfect rental! 🔑\n\nWe have apartments, houses, and villas available for rent in prime locations. Our rental prices range from KES 50,000 to KES 500,000+/month.\n\nWhat type of property are you looking for?",
        options: [
            { label: "🏢 Apartment", value: "I'm interested in apartments" },
            { label: "🏡 House", value: "I'm interested in houses" },
            { label: "🏛️ Villa", value: "I'm interested in villas" },
            { label: "🔍 Search rentals", value: "search rent" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
        ],
    },
    "price": {
        text: "Here's a general pricing guide for properties in Kenya 💰:\n\n🏢 Apartments: KES 5M – 35M\n🏠 Houses: KES 15M – 80M\n🏛️ Villas: KES 40M – 150M+\n🏘️ Townhouses: KES 12M – 50M\n🌿 Land: KES 3M – 100M+\n\nPrices vary by location and amenities. Want to see specific listings?",
        options: [
            { label: "🔍 Search by price", value: "search_properties" },
            { label: "📋 View listings", value: "Show me property listings" },
            { label: "💵 Most affordable", value: "What are the most affordable options?" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
        ],
    },
    "agent": {
        text: "I'll connect you with one of our expert agents right away! 👋\n\nYou can reach our team through:\n\n📞 Phone: +254 700 123 456\n📧 Email: hello@estatevue.com\n💬 WhatsApp: +254 700 123 456\n\nOr visit our Agents page to find a specialist for your needs. Our agents are available Mon-Sat, 8AM-6PM EAT.",
        options: [
            { label: "📞 Call now", value: "call_agent" },
            { label: "💬 WhatsApp", value: "whatsapp_agent" },
            { label: "👥 View all agents", value: "view_agents" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "process": {
        text: "Here's how it works at EstateVue 📋:\n\n1. Search — Browse our listings and use filters to find properties that match your needs.\n\n2. Schedule a Viewing — Contact our agents to arrange in-person or virtual property tours.\n\n3. Make an Offer — Our team helps you negotiate the best deal.\n\n4. Close the Deal — We handle the paperwork and legal processes until you get your keys! 🔑\n\nReady to start?",
        options: [
            { label: "🏠 Browse properties", value: "Show me property listings" },
            { label: "🔍 Search properties", value: "search_properties" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "nairobi": {
        text: "Nairobi has some amazing neighborhoods! 📍\n\n🌳 Karen — Spacious homes, leafy suburbs (KES 30M–120M)\n🏙️ Westlands — Modern apartments, vibrant nightlife (KES 10M–40M)\n💎 Kilimani — Central location, great amenities (KES 8M–35M)\n🌿 Runda — Luxury estates, top security (KES 60M–200M)\n🏡 Kitisuru — Family-friendly, green spaces (KES 25M–80M)\n\nWant me to search for properties in a specific Nairobi area?",
        options: [
            { label: "🔍 Search Nairobi", value: "search nairobi" },
            { label: "📋 View listings", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "mombasa": {
        text: "Mombasa offers beautiful coastal living! 🌊\n\n🏖️ Nyali — Beach proximity, luxury villas (KES 25M–100M)\n🌴 Bamburi — Affordable apartments, vibrant area (KES 5M–20M)\n🛳️ Tudor — Heritage charm, waterfront views (KES 8M–30M)\n\nPerfect for vacations or permanent residence!",
        options: [
            { label: "🔍 Search Mombasa", value: "search mombasa" },
            { label: "📋 View listings", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "affordable": {
        text: "Here are some great affordable options 💵:\n\n🏢 1-2 Bedroom Apartments in Kilimani/South B — From KES 5M\n🏘️ Townhouses in Syokimau/Athi River — From KES 8M\n🌿 Land in Konza/Kangundo Road — From KES 1.5M\n\nLet me search for the most affordable listings for you!",
        options: [
            { label: "🔍 Search affordable", value: "search affordable" },
            { label: "📋 View listings", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "listings": {
        text: "I'd recommend browsing our Properties page where you can filter by:\n\n✅ Location\n✅ Price range\n✅ Property type\n✅ Number of bedrooms\n✅ Amenities\n\nOr I can search right here in the chat! Just tell me what you're looking for.",
        options: [
            { label: "🔗 Go to Properties", value: "go_properties" },
            { label: "🔍 Search here", value: "search_properties" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "apartment": {
        text: "Great taste! 🏢 Apartments are our most popular category.\n\nWe have options ranging from cozy studios to spacious 4-bedroom penthouses:\n\n• Studios & 1-Bed — From KES 5M (ideal for singles/couples)\n• 2-3 Bed — KES 8M–25M (great for families)\n• Penthouses — KES 20M–50M+ (luxury living)\n\nMost come with amenities like gym, pool, parking, and 24-hour security.",
        options: [
            { label: "🔍 Search apartments", value: "search apartment" },
            { label: "📋 View apartments", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "house": {
        text: "Houses are perfect for families looking for space! 🏠\n\nOur listings include:\n\n• 3-Bedroom Bungalows — From KES 15M\n• 4-Bedroom Maisonettes — KES 20M–50M\n• 5+ Bedroom Mansions — KES 40M–120M\n\nMost homes come with private gardens, parking, and secure compounds.",
        options: [
            { label: "🔍 Search houses", value: "search house" },
            { label: "📋 View houses", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "villa": {
        text: "Villas are our premium offering! 🏛️\n\nThese luxurious properties feature:\n\n• Private swimming pools\n• Expansive gardens & landscaping\n• Staff quarters & multiple parking\n• Smart home technology\n• Ocean or garden views\n\nPriced from KES 40M to over KES 200M.",
        options: [
            { label: "🔍 Search villas", value: "search villa" },
            { label: "📋 View villas", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "bedrooms": {
        text: "Here's what you can expect by bedroom count 🛏️:\n\n• 1 Bedroom — KES 5M–12M\n• 2 Bedrooms — KES 8M–20M\n• 3 Bedrooms — KES 12M–35M\n• 4 Bedrooms — KES 20M–60M\n• 5+ Bedrooms — KES 40M–150M+\n\nHow many bedrooms do you need? I can search for you!",
        options: [
            { label: "🔍 Search properties", value: "search_properties" },
            { label: "📋 View properties", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "viewing": {
        text: "We'd love to arrange a viewing for you! 📅\n\nYou have two options:\n\n🏠 In-Person Viewing — Our agent will meet you at the property for a private tour.\n\n📱 Virtual Tour — Get a live video walkthrough from the comfort of your home.\n\nViewings are available Mon-Sat, 9AM-5PM.",
        options: [
            { label: "👥 View our agents", value: "view_agents" },
            { label: "📞 Call to book", value: "call_agent" },
            { label: "💬 WhatsApp us", value: "whatsapp_agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "mortgage": {
        text: "Great question about financing! 💳\n\nWe work with several leading banks in Kenya:\n\n🏦 Current rates range from 12% to 16% p.a.\n📄 Most banks require 10-20% down payment\n⏳ Loan terms of up to 25 years\n\n🧮 **Tip:** Each property page now has a built-in Mortgage Calculator! Check it out on any listing.",
        options: [
            { label: "🔍 Search properties", value: "search_properties" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "land": {
        text: "Looking for land? 🌿 Great investment choice!\n\nWe have plots available in:\n\n📍 Nairobi suburbs — From KES 5M\n📍 Nairobi premium — From KES 30M\n📍 Coast — From KES 3M\n📍 Upcountry — From KES 1.5M\n\nAll plots come with verified title deeds.",
        options: [
            { label: "🔍 Search land", value: "search land" },
            { label: "📋 View land listings", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "security": {
        text: "Safety is our top priority! 🔒\n\nMost of our listed properties come with:\n\n✅ 24/7 security guards\n✅ CCTV surveillance\n✅ Electric fencing & alarms\n✅ Controlled gate access\n✅ Gated community compounds",
        options: [
            { label: "🔍 Search secure properties", value: "search security" },
            { label: "📋 View properties", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "thanks": {
        text: "You're very welcome! 😊 I'm glad I could help.\n\nIf you have any more questions about properties, pricing, or anything else — don't hesitate to ask! I'm here anytime.\n\nHappy house hunting! 🏡",
        options: [
            { label: "🔍 Search properties", value: "search_properties" },
            { label: "🏠 Browse properties", value: "Show me property listings" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "goodbye": {
        text: "Goodbye! 👋 It was great chatting with you.\n\nRemember, you can come back anytime you have questions. We're always here to help you find your dream home!\n\nHave a wonderful day! ✨",
        options: [
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "yes": {
        text: "Awesome! Let me know what you'd like to explore 😊",
        options: INITIAL_OPTIONS,
    },
    "no": {
        text: "No worries at all! 😊 If you change your mind or have other questions, I'm right here.",
        options: [
            { label: "🔍 Search properties", value: "search_properties" },
            { label: "🏠 Browse properties", value: "Show me property listings" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "location": {
        text: "We have properties in several great locations across Kenya! 📍\n\n🏙️ Nairobi — Capital city, diverse options\n🌊 Mombasa — Coastal living, beach properties\n🌻 Nakuru — Lake region, affordable options\n🏔️ Nanyuki — Mountain views, serene environment\n🌴 Kisumu — Lakeside, emerging market\n\nWhich city interests you?",
        options: [
            { label: "📍 Nairobi", value: "I'm looking for properties in Nairobi" },
            { label: "🌊 Mombasa", value: "I'm looking for properties in Mombasa" },
            { label: "🔍 Search by location", value: "search_properties" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "about": {
        text: "EstateVue is Kenya's premier real estate platform! 🌟\n\n🏆 Trusted by 1,200+ happy clients\n🏠 2,500+ verified property listings\n👥 85+ licensed expert agents\n⭐ 4.9 average customer rating\n\nWe're committed to making property buying, selling, and renting transparent, easy, and enjoyable.",
        options: [
            { label: "👥 Meet our agents", value: "view_agents" },
            { label: "🔍 Search properties", value: "search_properties" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "search_prompt": {
        text: "🔍 Let's find your dream property!\n\nTell me what you're looking for. For example:\n\n• \"3 bedroom apartment in Karen\"\n• \"Villa for sale under 50 million\"\n• \"Affordable house in Nairobi\"\n• \"Property for rent in Kilimani\"\n\nOr just type your requirements:",
        options: [
            { label: "🏢 Apartments", value: "search apartment" },
            { label: "🏠 Houses", value: "search house" },
            { label: "🏛️ Villas", value: "search villa" },
            { label: "💵 Under KES 20M", value: "search affordable" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "default": {
        text: "I appreciate your question! 😊 Let me point you in the right direction.\n\nI can help you with:\n\n🏠 Buying or renting properties\n💰 Property pricing and locations\n🏢 Specific property types\n🔍 Searching our live listings\n📅 Scheduling property viewings\n💳 Mortgage and financing info\n👤 Connecting you with expert agents\n\nJust ask about any of these, or pick an option below!",
        options: INITIAL_OPTIONS,
    },
};

// Property Search Engine — searches both Firestore and sample data
async function searchProperties(query: string): Promise<PropertyResult[]> {
    const lower = query.toLowerCase();

    // Build a combined property list
    let allProperties: PropertyResult[] = [];

    // Sample properties
    allProperties = sampleProperties.map((p: Property) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        location: `${p.location.neighborhood}, ${p.location.city}`,
        type: p.type,
        listingType: p.listingType,
        image: p.images[0],
    }));

    // Firestore properties
    try {
        const firestoreData = await getAllProperties();
        const firestoreResults = firestoreData
            .filter(p => p.status === "active")
            .map((p: FirestoreProperty) => ({
                id: p.id || "",
                title: p.title,
                price: p.price,
                currency: p.currency || "KES",
                bedrooms: p.bedrooms,
                bathrooms: p.bathrooms,
                location: `${p.neighborhood}, ${p.city}`,
                type: p.type,
                listingType: p.listingType,
                image: p.images?.[0] || "/images/property-1.png",
            }));
        allProperties = [...firestoreResults, ...allProperties];
    } catch {
        // Continue with sample data if Firestore fails
    }

    // Extract search criteria
    let results = [...allProperties];

    // Filter by listing type
    if (lower.includes("rent") || lower.includes("rental")) {
        results = results.filter(p => p.listingType === "rent");
    } else if (lower.includes("sale") || lower.includes("buy") || lower.includes("purchase")) {
        results = results.filter(p => p.listingType === "sale");
    }

    // Filter by property type
    const types = ["apartment", "house", "villa", "townhouse", "land", "commercial"];
    for (const t of types) {
        if (lower.includes(t)) {
            results = results.filter(p => p.type === t);
            break;
        }
    }
    if (lower.includes("flat") || lower.includes("condo")) {
        results = results.filter(p => p.type === "apartment");
    }
    if (lower.includes("mansion") || lower.includes("bungalow")) {
        results = results.filter(p => p.type === "house");
    }

    // Filter by bedrooms
    const bedroomMatch = lower.match(/(\d)\s*(?:bed|bedroom|br|bd)/);
    if (bedroomMatch) {
        const beds = parseInt(bedroomMatch[1]);
        results = results.filter(p => p.bedrooms === beds);
    }

    // Filter by location
    const locations = ["karen", "westlands", "kilimani", "runda", "kitisuru", "lavington",
        "kileleshwa", "nairobi", "mombasa", "nyali", "nakuru", "nanyuki", "langata",
        "south b", "south c", "kiambu", "thika"];
    for (const loc of locations) {
        if (lower.includes(loc)) {
            results = results.filter(p => p.location.toLowerCase().includes(loc));
            break;
        }
    }

    // Filter by price
    const priceMatch = lower.match(/under\s+(?:kes\s+)?(\d+)\s*(m|million|k|thousand)?/i);
    if (priceMatch) {
        let maxPrice = parseInt(priceMatch[1]);
        if (priceMatch[2]?.startsWith("m") || priceMatch[2] === "million") maxPrice *= 1000000;
        else if (priceMatch[2] === "k" || priceMatch[2] === "thousand") maxPrice *= 1000;
        else if (maxPrice < 1000) maxPrice *= 1000000; // Assume "under 50" = under 50M
        results = results.filter(p => p.price <= maxPrice);
    }

    // Affordable filter
    if (lower.includes("affordable") || lower.includes("cheap") || lower.includes("budget")) {
        results.sort((a, b) => a.price - b.price);
    }

    // Security filter
    if (lower.includes("security") || lower.includes("secure") || lower.includes("safe")) {
        // Can't filter by amenities easily, just return all with text match
    }

    // Return top 4
    return results.slice(0, 4);
}

function classifyMessage(msg: string): string {
    const lower = msg.toLowerCase().trim();

    // Greetings
    const greetings = ["hi", "hello", "hey", "hola", "howdy", "sup", "yo", "hii", "hiii", "helloo", "good morning", "good afternoon", "good evening", "morning", "afternoon", "evening", "whats up", "what's up", "wassup", "greetings", "jambo", "sasa", "niaje", "mambo", "habari", "salaam"];
    if (greetings.some(g => lower === g || lower === g + "!" || lower === g + "." || lower === g + "?" || lower.startsWith(g + " ") || lower.startsWith(g + ","))) return "greeting";

    // Thanks
    const thanks = ["thank", "thanks", "thx", "thankyou", "thank you", "appreciate", "grateful", "asante", "cheers"];
    if (thanks.some(t => lower.includes(t))) return "thanks";

    // Goodbye
    const byes = ["bye", "goodbye", "good bye", "see you", "later", "gtg", "gotta go", "take care", "goodnight", "good night", "ciao"];
    if (byes.some(b => lower === b || lower === b + "!" || lower.includes(b))) return "goodbye";

    // Yes
    if (["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "alright", "absolutely", "definitely", "of course", "please", "go ahead", "let's go", "sawa"].includes(lower.replace(/[!.]/g, ""))) return "yes";

    // No
    if (["no", "nah", "nope", "not really", "no thanks", "not now", "maybe later", "hapana"].includes(lower.replace(/[!.]/g, ""))) return "no";

    // Search intent — detect when user wants to search properties
    const hasSearchCriteria = (
        lower.match(/\d\s*(?:bed|bedroom|br)/) ||
        lower.match(/under\s+\d/) ||
        (lower.includes("search") && !lower.includes("search_properties")) ||
        (lower.includes("find") && lower.includes("property")) ||
        (lower.includes("show") && lower.includes("me") && (lower.includes("bedroom") || lower.includes("apartment") || lower.includes("house") || lower.includes("villa")))
    );
    if (hasSearchCriteria) return "search";

    // Buying
    if (lower.includes("buy") || lower.includes("purchase") || lower.includes("own") || lower.includes("buying") || lower.includes("invest in property") || lower.includes("i want a home") || lower.includes("i need a home") || lower.includes("looking for a home")) return "buy";

    // Renting
    if (lower.includes("rent") || lower.includes("lease") || lower.includes("tenant") || lower.includes("renting") || lower.includes("for hire")) return "rent";

    // Property types
    if (lower.includes("apartment") || lower.includes("flat") || lower.includes("studio") || lower.includes("penthouse") || lower.includes("condo")) return "apartment";
    if (lower.includes("villa") || lower.includes("mansion") || lower.includes("estate") || lower.includes("luxury home")) return "villa";
    if (lower.includes("house") || lower.includes("bungalow") || lower.includes("maisonette") || lower.includes("residential")) return "house";
    if (lower.includes("land") || lower.includes("plot") || lower.includes("acre") || lower.includes("hectare") || lower.includes("shamba")) return "land";

    // Price
    if (lower.includes("price") || lower.includes("cost") || lower.includes("how much") || lower.includes("pricing") || lower.includes("expensive") || lower.includes("value") || lower.includes("worth")) return "price";
    if (lower.includes("cheap") || lower.includes("affordable") || lower.includes("budget") || lower.includes("low price") || lower.includes("inexpensive")) return "affordable";

    // Mortgage
    if (lower.includes("mortgage") || lower.includes("loan") || lower.includes("financing") || lower.includes("finance") || lower.includes("bank") || lower.includes("payment plan") || lower.includes("installment") || lower.includes("down payment") || lower.includes("interest rate")) return "mortgage";

    // Bedrooms
    if (lower.includes("bedroom") || lower.includes("bed room")) return "bedrooms";

    // Viewing
    if (lower.includes("tour") || lower.includes("visit") || lower.includes("see the") || lower.includes("schedule") || lower.includes("appointment") || lower.includes("book a view")) return "viewing";

    // Security
    if (lower.includes("security") || lower.includes("safe") || lower.includes("safety") || lower.includes("gated") || lower.includes("cctv") || lower.includes("guard") || lower.includes("secure")) return "security";

    // Agent
    if (lower.includes("agent") || lower.includes("human") || lower.includes("customer care") || lower.includes("customer service") || lower.includes("support") || lower.includes("help me") || lower.includes("real person") || lower.includes("someone") || lower.includes("speak to") || lower.includes("talk to")) return "agent";
    if (lower.includes("call") || lower.includes("phone") || lower.includes("contact") || lower.includes("reach") || lower.includes("whatsapp") || lower.includes("email")) return "agent";

    // Locations
    if (lower.includes("nairobi") || lower.includes("karen") || lower.includes("westlands") || lower.includes("kilimani") || lower.includes("runda") || lower.includes("kitisuru") || lower.includes("lavington") || lower.includes("kileleshwa") || lower.includes("langata") || lower.includes("south b") || lower.includes("south c")) return "nairobi";
    if (lower.includes("mombasa") || lower.includes("nyali") || lower.includes("coast") || lower.includes("diani") || lower.includes("malindi") || lower.includes("bamburi") || lower.includes("beach")) return "mombasa";
    if (lower.includes("location") || lower.includes("area") || lower.includes("where") || lower.includes("city") || lower.includes("neighborhood") || lower.includes("suburb") || lower.includes("town") || lower.includes("nakuru") || lower.includes("kisumu") || lower.includes("nanyuki")) return "location";

    // Process
    if (lower.includes("process") || lower.includes("how does") || lower.includes("how do i") || lower.includes("how to") || lower.includes("step") || lower.includes("procedure") || lower.includes("what do i need")) return "process";

    // About
    if (lower.includes("about") || lower.includes("who are") || lower.includes("what is estatevue") || lower.includes("tell me about") || lower.includes("company") || lower.includes("your service")) return "about";

    // Listings
    if (lower.includes("listing") || lower.includes("browse") || lower.includes("properties") || lower.includes("show") || lower.includes("explore") || lower.includes("find") || lower.includes("available")) return "listings";

    // Menu
    if (lower.includes("main menu") || lower.includes("start over") || lower.includes("menu") || lower.includes("restart") || lower.includes("begin")) return "menu";

    return "default";
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Show greeting after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!hasGreeted) {
                setUnread(1);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [hasGreeted]);

    const openChat = () => {
        setIsOpen(true);
        setUnread(0);
        if (!hasGreeted) {
            setHasGreeted(true);
            const greeting: Message = {
                id: "greeting",
                text: "Hi there! 👋 I'm EstateVue's AI assistant. I can search our live property listings, answer questions, and connect you with agents.\n\nWhat are you looking for today?",
                sender: "bot",
                timestamp: new Date(),
                options: INITIAL_OPTIONS,
            };
            setMessages([greeting]);
        }
    };

    const addBotResponse = (category: string) => {
        setIsTyping(true);
        const delay = 800 + Math.random() * 600;

        setTimeout(() => {
            const response = AI_RESPONSES[category] || AI_RESPONSES["default"];
            const botMsg: Message = {
                id: Date.now().toString(),
                text: response.text,
                sender: "bot",
                timestamp: new Date(),
                options: response.options,
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, delay);
    };

    const handlePropertySearch = async (query: string) => {
        setIsTyping(true);
        try {
            const results = await searchProperties(query);
            const botMsg: Message = {
                id: Date.now().toString(),
                text: results.length > 0
                    ? `I found ${results.length} ${results.length === 1 ? "property" : "properties"} matching your search! 🏠`
                    : "I couldn't find exact matches for your search, but here are some suggestions. Try browsing our Properties page for more options!",
                sender: "bot",
                timestamp: new Date(),
                properties: results.length > 0 ? results : undefined,
                options: results.length > 0
                    ? [
                        { label: "🔍 Refine search", value: "search_properties" },
                        { label: "🔗 View all properties", value: "go_properties" },
                        { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
                    ]
                    : [
                        { label: "🔍 Try another search", value: "search_properties" },
                        { label: "🔗 Browse all", value: "go_properties" },
                        { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
                    ],
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
            const errorMsg: Message = {
                id: Date.now().toString(),
                text: "Sorry, I had trouble searching right now. You can browse properties directly on our Properties page!",
                sender: "bot",
                timestamp: new Date(),
                options: [
                    { label: "🔗 Go to Properties", value: "go_properties" },
                    { label: "🔙 Main menu", value: "main_menu" },
                ],
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        const category = classifyMessage(input.trim());
        const currentInput = input.trim();
        setInput("");

        if (category === "menu") {
            setIsTyping(true);
            setTimeout(() => {
                const menuMsg: Message = {
                    id: Date.now().toString(),
                    text: "Sure! What would you like to know? 😊",
                    sender: "bot",
                    timestamp: new Date(),
                    options: INITIAL_OPTIONS,
                };
                setMessages((prev) => [...prev, menuMsg]);
                setIsTyping(false);
            }, 500);
            return;
        }

        if (category === "search") {
            handlePropertySearch(currentInput);
            return;
        }

        addBotResponse(category);
    };

    const handleQuickOption = (option: QuickOption) => {
        // Handle action options
        if (option.value === "call_agent") {
            window.open("tel:+254700123456", "_self");
            return;
        }
        if (option.value === "whatsapp_agent") {
            window.open("https://wa.me/254700123456?text=Hi%20EstateVue%2C%20I%20need%20help%20finding%20a%20property", "_blank");
            return;
        }
        if (option.value === "view_agents") {
            window.location.href = "/agents";
            return;
        }
        if (option.value === "go_properties") {
            window.location.href = "/properties";
            return;
        }
        if (option.value === "search_properties") {
            const userMsg: Message = {
                id: Date.now().toString(),
                text: "Search properties",
                sender: "user",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMsg]);
            addBotResponse("search_prompt");
            return;
        }
        if (option.value.startsWith("search ")) {
            const userMsg: Message = {
                id: Date.now().toString(),
                text: option.label.replace(/^[\p{Emoji}\s]+/u, "").trim() || option.value,
                sender: "user",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMsg]);
            handlePropertySearch(option.value.replace("search ", ""));
            return;
        }
        if (option.value === "main_menu") {
            const userMsg: Message = {
                id: Date.now().toString(),
                text: "Main menu",
                sender: "user",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setIsTyping(true);
            setTimeout(() => {
                const menuMsg: Message = {
                    id: Date.now().toString(),
                    text: "Sure! What would you like to know? 😊",
                    sender: "bot",
                    timestamp: new Date(),
                    options: INITIAL_OPTIONS,
                };
                setMessages((prev) => [...prev, menuMsg]);
                setIsTyping(false);
            }, 500);
            return;
        }

        // Regular text options
        const userMsg: Message = {
            id: Date.now().toString(),
            text: option.label.replace(/^[\p{Emoji}\s]+/u, "").trim() || option.value,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        const category = classifyMessage(option.value);

        if (category === "search") {
            handlePropertySearch(option.value);
            return;
        }

        addBotResponse(category);
    };

    return (
        <>
            {/* Chat Widget */}
            <div className={`${styles.chatWidget} ${isOpen ? styles.chatOpen : ""}`}>
                {/* Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.botAvatar}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8V4H8" /><rect x="2" y="8" width="20" height="12" rx="2" /><path d="M6 12h.01M10 12h.01" /><path d="M14 12h.01M18 12h.01" /><path d="M9 16s.9 1 3 1 3-1 3-1" /></svg>
                            <span className={styles.onlineDot} />
                        </div>
                        <div>
                            <h4 className={styles.headerTitle}>EstateVue AI</h4>
                            <span className={styles.headerStatus}>Online • Can search properties</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close chat">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Messages */}
                <div className={styles.chatMessages}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`${styles.message} ${msg.sender === "user" ? styles.userMsg : styles.botMsg}`}>
                            {msg.sender === "bot" && (
                                <div className={styles.msgAvatar}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="8" width="20" height="12" rx="2" /><path d="M9 16s.9 1 3 1 3-1 3-1" /><circle cx="8" cy="13" r="1" /><circle cx="16" cy="13" r="1" /></svg>
                                </div>
                            )}
                            <div className={styles.msgContent}>
                                <div className={styles.msgBubble}>
                                    {msg.text.split("\n").map((line, i) => (
                                        <span key={i}>
                                            {line.replace(/\*\*(.*?)\*\*/g, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                                            {i < msg.text.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                                {/* Property Cards */}
                                {msg.properties && msg.properties.length > 0 && (
                                    <div className={styles.propertyCards}>
                                        {msg.properties.map((prop) => (
                                            <a
                                                key={prop.id}
                                                href={`/properties/${prop.id}`}
                                                className={styles.propertyCard}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <div className={styles.propCardImage}>
                                                    <img src={prop.image} alt={prop.title} />
                                                    <span className={styles.propCardBadge}>
                                                        For {prop.listingType === "sale" ? "Sale" : "Rent"}
                                                    </span>
                                                </div>
                                                <div className={styles.propCardInfo}>
                                                    <h5>{prop.title}</h5>
                                                    <p className={styles.propCardLocation}>📍 {prop.location}</p>
                                                    <div className={styles.propCardMeta}>
                                                        <span>🛏️ {prop.bedrooms}</span>
                                                        <span>🚿 {prop.bathrooms}</span>
                                                    </div>
                                                    <p className={styles.propCardPrice}>
                                                        {formatPrice(prop.price, prop.currency)}
                                                        {prop.listingType === "rent" && "/mo"}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {msg.options && (
                                    <div className={styles.quickOptions}>
                                        {msg.options.map((opt) => (
                                            <button
                                                key={opt.value}
                                                className={styles.quickOption}
                                                onClick={() => handleQuickOption(opt)}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <span className={styles.msgTime}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className={`${styles.message} ${styles.botMsg}`}>
                            <div className={styles.msgAvatar}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="8" width="20" height="12" rx="2" /><circle cx="8" cy="13" r="1" /><circle cx="16" cy="13" r="1" /></svg>
                            </div>
                            <div className={styles.typingIndicator}>
                                <span /><span /><span />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={styles.chatInput}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search properties or ask a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className={styles.inputField}
                    />
                    <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()} aria-label="Send message">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                </div>

                {/* Powered By */}
                <div className={styles.poweredBy}>
                    Powered by <strong>EstateVue AI</strong> • <button className={styles.handoverBtn} onClick={() => handleQuickOption({ label: "Talk to agent", value: "I want to talk to an agent" })}>Talk to a human</button>
                </div>
            </div>

            {/* Floating Button */}
            {!isOpen && (
                <button className={styles.floatingBtn} onClick={openChat} aria-label="Open chat">
                    <div className={styles.floatingIcon}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                    <span className={styles.floatingLabel}>Chat with us</span>
                </button>
            )}
        </>
    );
}
