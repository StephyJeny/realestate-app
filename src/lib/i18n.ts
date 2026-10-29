/**
 * English (en) & Kenyan Kiswahili (sw) Localization Dictionary
 * Powers instant language switching across EstateVue without altering route URLs.
 */

export type Locale = "en" | "sw";

export interface LocaleOption {
    code: Locale;
    label: string;
    shortLabel: string;
    flag: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
    { code: "en", label: "English", shortLabel: "EN", flag: "🇬🇧" },
    { code: "sw", label: "Kiswahili", shortLabel: "SW", flag: "🇰🇪" },
];

export const EN_DICTIONARY = {
    // Navigation & Global Header
    "nav.buy": "Buy",
    "nav.rent": "Rent",
    "nav.offPlan": "🏗️ Off-Plan",
    "nav.properties": "Properties",
    "nav.aiValuer": "🤖 AI Valuer",
    "nav.matchmaker": "✨ Matchmaker",
    "nav.agents": "Agents",
    "nav.neighborhoods": "Neighborhoods",
    "nav.about": "About",
    "nav.install": "Install",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "nav.signIn": "Sign In",
    "nav.signOut": "Sign Out",
    "nav.explore": "Explore",
    "nav.map": "Map",
    "nav.tools": "Tools",
    "nav.saved": "Saved",
    "nav.inbox": "Inbox",
    "nav.quickHub": "EstateVue Quick Hub",
    "nav.currencyDisplay": "Currency Display",
    "nav.languageDisplay": "Language / Lugha",

    // Home Hero & Sections
    "home.welcomeBadge": "Welcome to EstateVue",
    "home.heroTitleTop": "Find Your Dream",
    "home.heroTitleAccent": "Luxury Home",
    "home.heroSubtitle":
        "Discover exclusive properties in prime locations across Kenya. Your perfect home awaits.",
    "home.smartSearchTab": "✨ AI Smart Search",
    "home.classicFiltersTab": "⚙️ Classic Filters",
    "home.smartPlaceholder":
        "Ask in plain English or Kiswahili: '3BR villa in Karen with pool under 50M'...",
    "home.purposeLabel": "Purpose",
    "home.buyOrRent": "Buy or Rent",
    "home.forSale": "For Sale",
    "home.forRent": "For Rent",
    "home.locationLabel": "Location",
    "home.allLocations": "All Locations",
    "home.propertyTypeLabel": "Property Type",
    "home.allTypes": "All Types",
    "home.priceRangeLabel": "Price Range",
    "home.anyPrice": "Any price",
    "home.statProperties": "Properties",
    "home.statClients": "Happy Clients",
    "home.statAgents": "Expert Agents",

    // Property Detail Page
    "detail.forSaleBadge": "For Sale",
    "detail.forRentBadge": "For Rent",
    "detail.bedrooms": "Bedrooms",
    "detail.bathrooms": "Bathrooms",
    "detail.area": "Area",
    "detail.yearBuilt": "Year Built",
    "detail.description": "Description",
    "detail.amenities": "Amenities & Features",
    "detail.scheduleViewing": "Schedule a Viewing",
    "detail.makeFormalOffer": "📝 Make a Formal Offer (LOI)",
    "detail.applyDigitalLease": "📝 Apply for Digital Lease",
    "detail.reserveMpesa": "💳 Reserve Now (KES 50,000)",
    "detail.payHoldingDeposit": "💳 Pay Holding Deposit",
    "detail.sendMessage": "Send Message",

    // Footer
    "footer.brandDesc":
        "Your premier destination for finding luxury properties and dream homes across Kenya. We connect buyers, diaspora investors, and tenants with verified real estate opportunities.",
    "footer.quickLinks": "Quick Links",
    "footer.propertyTypes": "Property Types",
    "footer.contactUs": "Contact Us",
    "footer.newsletter": "Newsletter",
    "footer.buyProperty": "Buy Property",
    "footer.rentProperty": "Rent Property",
    "footer.offPlanDevs": "Off-Plan Developments",
    "footer.allListings": "All Listings",
    "footer.ourAgents": "Our Agents",
    "footer.aboutUs": "About Us",
} as const;

export type TranslationKey = keyof typeof EN_DICTIONARY;

export const SW_DICTIONARY: Record<TranslationKey, string> = {
    // Navigation & Global Header
    "nav.buy": "Nunua",
    "nav.rent": "Kodi",
    "nav.offPlan": "🏗️ Miradi Mipya",
    "nav.properties": "Mali Zote",
    "nav.aiValuer": "🤖 Ukadiriaji AI",
    "nav.matchmaker": "✨ Chagua Nyumba",
    "nav.agents": "Mawakala",
    "nav.neighborhoods": "Mitaa",
    "nav.about": "Kuhusu",
    "nav.install": "Pakua",
    "nav.dashboard": "Dashibodi",
    "nav.profile": "Wasifu",
    "nav.signIn": "Ingia",
    "nav.signOut": "Ondoka",
    "nav.explore": "Gundua",
    "nav.map": "Ramani",
    "nav.tools": "Zana",
    "nav.saved": "Zilizohifadhiwa",
    "nav.inbox": "Ujumbe",
    "nav.quickHub": "Kituo cha Haraka cha EstateVue",
    "nav.currencyDisplay": "Sarafu ya Bei",
    "nav.languageDisplay": "Lugha / Language",

    // Home Hero & Sections
    "home.welcomeBadge": "Karibu EstateVue Kenya",
    "home.heroTitleTop": "Pata Nyumba ya",
    "home.heroTitleAccent": "Ndoto Zako",
    "home.heroSubtitle":
        "Gundua makazi ya kifahari na uwekezaji bora katika miji mikuu ya Kenya. Makazi yako kamili yanakungoja.",
    "home.smartSearchTab": "✨ Utafutaji wa AI",
    "home.classicFiltersTab": "⚙️ Vichujio vya Kawaida",
    "home.smartPlaceholder":
        "Uliza kwa Kiswahili au Kiingereza: 'Villa ya vyumba 3 Karen chini ya 50M'...",
    "home.purposeLabel": "Lengo",
    "home.buyOrRent": "Nunua au Kodi",
    "home.forSale": "Inauzwa",
    "home.forRent": "Inapangishwa",
    "home.locationLabel": "Eneo / Mji",
    "home.allLocations": "Maeneo Yote",
    "home.propertyTypeLabel": "Aina ya Mali",
    "home.allTypes": "Aina Zote",
    "home.priceRangeLabel": "Kiwango cha Bei",
    "home.anyPrice": "Bei Yoyote",
    "home.statProperties": "Mali Zilizoorodheshwa",
    "home.statClients": "Wateja Wenye Furaha",
    "home.statAgents": "Mawakala Wataalam",

    // Property Detail Page
    "detail.forSaleBadge": "Inauzwa",
    "detail.forRentBadge": "Inapangishwa",
    "detail.bedrooms": "Vyumba",
    "detail.bathrooms": "Bafu",
    "detail.area": "Ukubwa",
    "detail.yearBuilt": "Mwaka wa Ujenzi",
    "detail.description": "Maelezo ya Mali",
    "detail.amenities": "Huduma na Vifaa",
    "detail.scheduleViewing": "Panga Kutembelea Mali",
    "detail.makeFormalOffer": "📝 Tuma Ofa Rasmi (LOI)",
    "detail.applyDigitalLease": "📝 Omba Mkataba wa Kupanga",
    "detail.reserveMpesa": "💳 Hifadhi Sasa (KES 50,000)",
    "detail.payHoldingDeposit": "💳 Lipa Amana ya Kuhifadhi",
    "detail.sendMessage": "Tuma Ujumbe",

    // Footer
    "footer.brandDesc":
        "Jukwaa lako kuu la kutafuta nyumba za kifahari, viwanja na uwekezaji kote Kenya. Tunawaunganisha wanunuzi, Wakenya wa diaspora na wapangaji na mali zilizothibitishwa.",
    "footer.quickLinks": "Viungo vya Haraka",
    "footer.propertyTypes": "Aina za Mali",
    "footer.contactUs": "Wasiliana Nasi",
    "footer.newsletter": "Jarida la Soko",
    "footer.buyProperty": "Nunua Mali",
    "footer.rentProperty": "Kodi Nyumba",
    "footer.offPlanDevs": "Miradi ya Off-Plan",
    "footer.allListings": "Orodha Zote",
    "footer.ourAgents": "Mawakala Wetu",
    "footer.aboutUs": "Kuhusu Sisi",
};

export const TRANSLATIONS: Record<Locale, Record<TranslationKey, string>> = {
    en: EN_DICTIONARY,
    sw: SW_DICTIONARY,
};

export function isValidLocale(code: unknown): code is Locale {
    return code === "en" || code === "sw";
}

/**
 * Translates a dictionary key in the given locale with optional `{{var}}` interpolation.
 * Safely falls back to English if a key is missing.
 */
export function translate(
    locale: Locale,
    key: TranslationKey,
    vars?: Record<string, string | number>
): string {
    const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
    let template: string = dict[key] ?? TRANSLATIONS.en[key] ?? key;

    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            template = template.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), String(v));
        }
    }

    return template;
}
