/**
 * AI Virtual Staging ("Reimagine This Room") & Kenyan Fit-Out / Renovation Cost Engine
 * Supports curated Kenyan & international luxury interior aesthetics, spatial hotspots,
 * itemized furnishing/renovation BOQ estimates, and furnished rental yield uplift projections.
 */

export type StagingStyleId =
    | "afro_minimalist"
    | "swahili_coastal"
    | "executive_modern"
    | "karen_biophilic"
    | "turnkey_airbnb";

export type RoomScopeId =
    | "living_dining"
    | "master_suite"
    | "kitchen"
    | "full_home";

export type FitOutTierId =
    | "furnishing_only"
    | "light_refresh"
    | "full_renovation";

export interface SpatialHotspot {
    id: string;
    xPct: number;
    yPct: number;
    item: string;
    materialNote: string;
    estCostKES: number;
}

export interface StagingStylePreset {
    id: StagingStyleId;
    name: string;
    tagline: string;
    emoji: string;
    palette: string[];
    cssFilter: string;
    overlayGradient: string;
    blendMode: "multiply" | "soft-light" | "overlay" | "color";
    overlayOpacity: number;
    costMultiplier: number;
    rentalYieldBoostPct: number; // Incremental furnished rental yield boost
    materialsSummary: string[];
    curatorNotes: Record<RoomScopeId, string[]>;
    hotspots: SpatialHotspot[];
}

export interface StagingBudgetLineItem {
    id: string;
    label: string;
    category: "furniture" | "joinery" | "lighting_smart" | "civil_finishes" | "design_fee";
    amountKES: number;
    note: string;
}

export interface StagingBudgetBreakdown {
    styleId: StagingStyleId;
    roomScope: RoomScopeId;
    fitOutTier: FitOutTierId;
    targetAreaSqFt: number;
    totalEstimateKES: number;
    lowEstimateKES: number;
    highEstimateKES: number;
    estimatedTimelineWeeks: number;
    estimatedMonthlyRentUpliftKES: number;
    estimatedResaleValueUpliftKES: number;
    paybackMonthsEstimate: number;
    lineItems: StagingBudgetLineItem[];
}

export const STAGING_STYLES: StagingStylePreset[] = [
    {
        id: "afro_minimalist",
        name: "Afro-Minimalist",
        tagline: "Warm Rift Valley terracotta, sculpted Mvule timber & hand-loomed sisal textures",
        emoji: "🏺",
        palette: ["#C87D55", "#E8DCCB", "#3E2F26", "#8B9A7B"],
        cssFilter: "sepia(0.24) saturate(1.22) contrast(1.06) brightness(1.02)",
        overlayGradient:
            "radial-gradient(circle at 28% 24%, rgba(232, 185, 118, 0.28), rgba(164, 92, 52, 0.22) 60%, rgba(36, 24, 18, 0.34) 100%)",
        blendMode: "soft-light",
        overlayOpacity: 0.85,
        costMultiplier: 1.05,
        rentalYieldBoostPct: 2.4,
        materialsSummary: [
            "Kiln-dried Kenyan Mvule hardwood joinery",
            "Limewash textured feature plaster in warm sand",
            "Hand-woven Machakos sisal & merino area rugs",
            " Soapstone & hammered brass pendant lighting",
        ],
        curatorNotes: {
            living_dining: [
                "Anchor the lounge with a low-slung bouclé modular sofa paired with a hand-carved Mvule coffee table.",
                "Apply warm sand micro-cement / limewash to the primary focal wall to soften daylight glare.",
                "Layer recessed 2700K warm LED coves with sculptural Kenyan ceramic floor lamps.",
            ],
            master_suite: [
                "Introduce a floating Mvule platform bed with woven cane headboard panels and organic linen bedding.",
                "Add floor-to-ceiling sheer oatmeal drapery to maximize cross-ventilation and diffuse morning sun.",
                "Fit concealed fluted-timber wardrobe doors with warm integrated strip lighting.",
            ],
            kitchen: [
                "Reface cabinetry in matte Rift-cut oak veneer accented by honed Nero Zimbabwe granite worktops.",
                "Install brushed aged-brass mixer tapware and open floating timber display shelves.",
                "Frame the breakfast bar with three hand-turned hardwood counter stools.",
            ],
            full_home: [
                "Unify reception, bedrooms, and circulation zones under a warm earthy palette of sand, terracotta, and Mvule.",
                "Upgrade all decorative luminaires to dimmable 2700K architectural brass & woven pendants.",
                "Curate bespoke Kenyan contemporary wall art and oversized indoor fiddle-leaf planters.",
            ],
        },
        hotspots: [
            {
                id: "am-1",
                xPct: 28,
                yPct: 64,
                item: "Bespoke Mvule & Bouclé Lounge Suite",
                materialNote: "Kiln-dried Kenyan hardwood frame + stain-guard Belgian linen",
                estCostKES: 340_000,
            },
            {
                id: "am-2",
                xPct: 56,
                yPct: 26,
                item: "Hammered Brass & Woven Sisal Pendant Trio",
                materialNote: "2700K warm dimmable LED artisanal suspension lights",
                estCostKES: 95_000,
            },
            {
                id: "am-3",
                xPct: 72,
                yPct: 58,
                item: "Limewash Focal Wall & Fluted Timber Console",
                materialNote: "Breathable mineral limewash + concealed media joinery",
                estCostKES: 165_000,
            },
        ],
    },
    {
        id: "swahili_coastal",
        name: "Swahili Coastal",
        tagline: "Lamu coral-lime plaster, carved dhow teak daybeds, breezy linen & ocean turquoise",
        emoji: "🌊",
        palette: ["#1E7F8C", "#F4EFE6", "#A66E4E", "#D9B982"],
        cssFilter: "saturate(1.26) contrast(1.04) brightness(1.06) hue-rotate(-6deg)",
        overlayGradient:
            "linear-gradient(135deg, rgba(56, 189, 248, 0.20) 0%, rgba(254, 243, 199, 0.22) 55%, rgba(14, 116, 144, 0.26) 100%)",
        blendMode: "soft-light",
        overlayOpacity: 0.88,
        costMultiplier: 1.08,
        rentalYieldBoostPct: 3.1,
        materialsSummary: [
            "Traditional Lamu Vidaka niche plasterwork",
            "Seasoned coastal teak & mangrove-inspired joinery",
            "Marine-grade brass hardware & ceiling breeze fans",
            "Breathable Belgian flax linen & turquoise kilim accents",
        ],
        curatorNotes: {
            living_dining: [
                "Introduce a carved Swahili teak baraza daybed dressed in crisp white linen and ocean-indigo bolsters.",
                "Craft recessed coral-white Vidaka wall niches with subtle warm pin-spot illumination.",
                "Pair a bleached mango-wood 8-seater dining table with woven rattan armchairs.",
            ],
            master_suite: [
                "Center a four-poster coastal teak canopy bed draped in lightweight mosquito-sheer voile.",
                "Fit whisper-quiet tropical timber-blade ceiling fans and louvered wardrobe shutters.",
                "Layer cool micro-terrazzo underfoot with handwoven coastal palm bedside runners.",
            ],
            kitchen: [
                "Combine chalk-white shaker cabinetry with sea-glass zellige tile splashbacks.",
                "Specify marine-grade 316 brushed stainless & brass coastal fixtures resistant to salt air.",
                "Add an open coral-plaster pantry alcove with woven storage baskets.",
            ],
            full_home: [
                "Transform the residence into a high-occupancy holiday sanctuary blending Lamu heritage with resort comfort.",
                "Apply bright coastal chalk-lime finishes and UV-filtering sheer window treatments throughout.",
                "Include weatherproof terrace loungers and outdoor al-fresco dining furniture.",
            ],
        },
        hotspots: [
            {
                id: "sc-1",
                xPct: 32,
                yPct: 66,
                item: "Carved Lamu Teak Baraza Daybed",
                materialNote: "Hand-carved seasoned teak + quick-dry coastal linen cushions",
                estCostKES: 260_000,
            },
            {
                id: "sc-2",
                xPct: 50,
                yPct: 22,
                item: "Tropical Hardwood Designer Ceiling Fan & Lanterns",
                materialNote: "Whisper-DC motor + pierced Swahili brass pendant lanterns",
                estCostKES: 115_000,
            },
            {
                id: "sc-3",
                xPct: 75,
                yPct: 52,
                item: "Vidaka Plaster Niche & Sea-Glass Zellige Accent",
                materialNote: "Artisanal coastal lime plasterwork with warm LED uplights",
                estCostKES: 185_000,
            },
        ],
    },
    {
        id: "executive_modern",
        name: "Executive Modern",
        tagline: "Smoked oak wall panelling, cognac Italian leather, marble & diplomatic luxury",
        emoji: "🏙️",
        palette: ["#111827", "#D4A017", "#78350F", "#CBD5E1"],
        cssFilter: "contrast(1.14) saturate(0.92) brightness(0.97)",
        overlayGradient:
            "linear-gradient(160deg, rgba(15, 23, 42, 0.34) 0%, rgba(212, 160, 23, 0.18) 55%, rgba(15, 23, 42, 0.42) 100%)",
        blendMode: "soft-light",
        overlayOpacity: 0.9,
        costMultiplier: 1.24,
        rentalYieldBoostPct: 3.4,
        materialsSummary: [
            "Smoked walnut & acoustic slat wall panelling",
            "Full-grain cognac leather & charcoal velvet upholstery",
            "Book-matched Calacatta porcelain & brushed champagne gold",
            "Smart motorized blinds & Lutron-style scene dimming",
        ],
        curatorNotes: {
            living_dining: [
                "Clad the media wall in book-matched Calacatta slab porcelain flanked by smoked-oak acoustic slats.",
                "Position an L-shaped Italian cognac leather sofa opposite a smoked-glass & brass cocktail table.",
                "Automate window treatments with dual-roller motorized blackout and solar-screen shades.",
            ],
            master_suite: [
                "Install a full-width upholstered suede headboard wall with integrated reading sconces and USB-C switching.",
                "Fit smoked-glass walk-in wardrobe vitrines with motion-activated warm LED shelving.",
                "Add a diplomatic executive study desk corner with acoustic wall treatment for global video calls.",
            ],
            kitchen: [
                "Upgrade to handleless matte-anthracite cabinetry with waterfall quartz island and concealed appliance garage.",
                "Integrate under-cabinet linear task lighting and a dual-zone wine chiller.",
                "Pair with sculptural saddle-leather barstools and gunmetal sinkware.",
            ],
            full_home: [
                "Deliver an embassy- & C-suite-ready turnkey specification commanding top corporate lease rates in Nairobi.",
                "Integrate smart scene lighting, motorized drapery, and acoustic timber panelling across key zones.",
                "Include a dedicated executive home-office setup and formal 8-to-10-seater marble dining suite.",
            ],
        },
        hotspots: [
            {
                id: "em-1",
                xPct: 26,
                yPct: 62,
                item: "Italian Cognac Leather Sectional Suite",
                materialNote: "Full-grain aniline leather + blackened steel architectural base",
                estCostKES: 520_000,
            },
            {
                id: "em-2",
                xPct: 62,
                yPct: 44,
                item: "Calacatta Slab & Smoked-Oak Acoustic Media Wall",
                materialNote: "Book-matched porcelain slab + concealed linear LED cove",
                estCostKES: 310_000,
            },
            {
                id: "em-3",
                xPct: 48,
                yPct: 20,
                item: "Motorized Smart Blinds & Architectural Track Lighting",
                materialNote: "App/voice-controlled drapery + magnetic 3000K spot rail",
                estCostKES: 195_000,
            },
        ],
    },
    {
        id: "karen_biophilic",
        name: "Karen Biophilic",
        tagline: "Botanical conservatory living, natural Kenyan stone, olive tones & indoor-outdoor flow",
        emoji: "🌿",
        palette: ["#2F5233", "#D8CFC2", "#6B4F3B", "#A3B18A"],
        cssFilter: "saturate(1.18) contrast(1.05) brightness(1.03) hue-rotate(6deg)",
        overlayGradient:
            "radial-gradient(circle at 70% 25%, rgba(134, 239, 172, 0.20), rgba(47, 82, 51, 0.22) 65%, rgba(28, 25, 23, 0.28) 100%)",
        blendMode: "soft-light",
        overlayOpacity: 0.85,
        costMultiplier: 1.12,
        rentalYieldBoostPct: 2.2,
        materialsSummary: [
            "Dressed Mazeras & bush-hammered Kenya stone accents",
            "Sage, moss & oatmeal performance linen upholstery",
            "Solid cedar & reclaimed railway-sleeper accent tables",
            "Curated indoor olive, strelitzia & monstera planters",
        ],
        curatorNotes: {
            living_dining: [
                "Frame garden views with moss-green linen seating, a solid cedar live-edge dining table, and Mazeras stone detailing.",
                "Incorporate architectural terracotta planters with mature indoor strelitzia and trailing greenery.",
                "Use warm bronze wall washers to highlight natural stone and timber grain at dusk.",
            ],
            master_suite: [
                "Create a tranquil forest-canopy retreat in sage, warm oat, and brushed oak.",
                "Add a window reading lounge chair with botanical wool throws overlooking the compound.",
                "Specify natural stone bathroom vanity tops with matte bronze fixtures.",
            ],
            kitchen: [
                "Pair forest-green shaker base cabinets with warm oak uppers and honed quartz counters.",
                "Add a sunlit herb-garden window ledge and solid brass hardware.",
                "Specify a generous farmhouse workstation sink and warm pendant task lighting.",
            ],
            full_home: [
                "Harmonize interior rooms with leafy suburban gardens through organic stone, timber, and botanical accents.",
                "Prioritize durable family-friendly natural textiles and warm, glare-free ambient lighting.",
                "Extend living space outdoors with covered veranda lounging and fire-pit seating.",
            ],
        },
        hotspots: [
            {
                id: "kb-1",
                xPct: 34,
                yPct: 65,
                item: "Moss-Linen Deep Lounge & Live-Edge Cedar Table",
                materialNote: "Stain-resistant botanical linen + sustainably sourced Kenyan cedar",
                estCostKES: 365_000,
            },
            {
                id: "kb-2",
                xPct: 76,
                yPct: 56,
                item: "Mazeras Natural Stone Feature & Planter Trio",
                materialNote: "Hand-dressed Kenyan Mazeras slate + mature indoor botanicals",
                estCostKES: 155_000,
            },
            {
                id: "kb-3",
                xPct: 52,
                yPct: 24,
                item: "Aged-Bronze Botanical Chandelier",
                materialNote: "Warm 2700K organic branch silhouette fixture",
                estCostKES: 110_000,
            },
        ],
    },
    {
        id: "turnkey_airbnb",
        name: "Turnkey Airbnb",
        tagline: "Instagram-ready accent walls, commercial-grade fabrics, work nook & 11–14% short-stay ROI",
        emoji: "🔑",
        palette: ["#D97706", "#1E293B", "#F8FAFC", "#0D9488"],
        cssFilter: "saturate(1.24) contrast(1.08) brightness(1.04)",
        overlayGradient:
            "linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(13, 148, 136, 0.22) 100%)",
        blendMode: "soft-light",
        overlayOpacity: 0.85,
        costMultiplier: 0.94,
        rentalYieldBoostPct: 3.8,
        materialsSummary: [
            "High-rub commercial performance velvet & wipeable finishes",
            "Photogenic geometric accent panelling & neon/art focal point",
            "Dedicated fiber-ready ergonomic remote-work station",
            "Smart keypad lock, luggage bench & hotel-grade 300TC percale",
        ],
        curatorNotes: {
            living_dining: [
                "Design a scroll-stopping hero shot wall with geometric painted panelling and curated Nairobi photography.",
                "Specify a sleeper-capable performance sofa, 65-inch smart TV swivel mount, and compact dining/work table.",
                "Keep surfaces durable, easy to turn over between guests, and brightly lit for listing photography.",
            ],
            master_suite: [
                "Install a hotel-grade zip-and-link king bed (convertible to twins) with crisp white percale and ochre throw.",
                "Include blackout curtains, bedside universal sockets, and a built-in luggage rack.",
                "Add a backlit vanity mirror that doubles as a compact laptop desk.",
            ],
            kitchen: [
                "Equip with quartz durable counters, Nespresso coffee bar station, induction hob, and full 6-guest crockery pack.",
                "Add bright under-cabinet LED strip lighting and matte black tapware.",
                "Maximize washer-dryer combo integration for week-long diaspora & business stays.",
            ],
            full_home: [
                "Complete turnkey short-stay Investor Pack — from furniture and smart lock down to cutlery, linens, and artwork.",
                "Engineered to maximize nightly ADR and Superhost occupancy in Westlands, Kilimani, and Nyali.",
                "Fast 3-to-4-week installation window so rental cashflow begins immediately after handover.",
            ],
        },
        hotspots: [
            {
                id: "ta-1",
                xPct: 30,
                yPct: 63,
                item: "Commercial-Grade Sleeper Sofa & Accent Chairs",
                materialNote: "50,000+ Martindale rub-count fabric for high guest turnover",
                estCostKES: 245_000,
            },
            {
                id: "ta-2",
                xPct: 68,
                yPct: 48,
                item: "Hero-Shot Geometric Wall + Ergonomic Work Nook",
                materialNote: "High-booking visual focal wall + executive remote-work desk",
                estCostKES: 130_000,
            },
            {
                id: "ta-3",
                xPct: 48,
                yPct: 24,
                item: "Smart Wi-Fi Keyless Entry & Mood Lighting Pack",
                materialNote: " Self-check-in PIN lock + dimmable warm ceiling fixtures",
                estCostKES: 85_000,
            },
        ],
    },
];

export const ROOM_SCOPE_OPTIONS: Array<{
    id: RoomScopeId;
    label: string;
    areaShareFactor: number;
    icon: string;
}> = [
    { id: "living_dining", label: "Living & Dining", areaShareFactor: 0.34, icon: "🛋️" },
    { id: "master_suite", label: "Master Suite", areaShareFactor: 0.24, icon: "🛏️" },
    { id: "kitchen", label: "Gourmet Kitchen", areaShareFactor: 0.18, icon: "🍳" },
    { id: "full_home", label: "Full Residence", areaShareFactor: 1.0, icon: "🏡" },
];

export const FIT_OUT_TIER_OPTIONS: Array<{
    id: FitOutTierId;
    label: string;
    subtitle: string;
    baseCostPerSqFtKES: number;
    weeksBase: number;
}> = [
    {
        id: "furnishing_only",
        label: "Turnkey Furnishing",
        subtitle: "Furniture, rugs, curtains, art & decorative lighting",
        baseCostPerSqFtKES: 1_450,
        weeksBase: 3,
    },
    {
        id: "light_refresh",
        label: "Paint, Joinery & Decor",
        subtitle: "Feature walls, custom TV/wardrobe joinery, lighting + furniture",
        baseCostPerSqFtKES: 2_350,
        weeksBase: 5,
    },
    {
        id: "full_renovation",
        label: "Full Luxury Renovation",
        subtitle: "Flooring, cabinetry, sanitaryware, MEP lighting + bespoke furniture",
        baseCostPerSqFtKES: 4_100,
        weeksBase: 9,
    },
];

export function getStagingStyleById(styleId: StagingStyleId): StagingStylePreset {
    return STAGING_STYLES.find((s) => s.id === styleId) || STAGING_STYLES[0];
}

/**
 * Computes itemized Kenyan interior furnishing & renovation BOQ + investment payback metrics.
 */
export function calculateStagingBudget(params: {
    styleId: StagingStyleId;
    roomScope: RoomScopeId;
    fitOutTier: FitOutTierId;
    propertyAreaSqFt: number;
    bedrooms?: number;
    propertyPriceKES?: number;
}): StagingBudgetBreakdown {
    const style = getStagingStyleById(params.styleId);
    const scope = ROOM_SCOPE_OPTIONS.find((r) => r.id === params.roomScope) || ROOM_SCOPE_OPTIONS[0];
    const tier = FIT_OUT_TIER_OPTIONS.find((t) => t.id === params.fitOutTier) || FIT_OUT_TIER_OPTIONS[0];

    const safeTotalSqFt = Math.max(450, Math.min(15_000, Number(params.propertyAreaSqFt) || 1_600));
    const targetAreaSqFt = Math.max(160, Math.round(safeTotalSqFt * scope.areaShareFactor));
    const beds = Math.max(1, Number(params.bedrooms) || 3);

    // Subtle economies of scale on very large villas (>3,000 sqft)
    const scaleFactor = safeTotalSqFt > 3_200 ? 0.86 : safeTotalSqFt > 2_200 ? 0.93 : 1.0;

    // Kitchen renovations are denser per sqft due to stone counters & hardware
    const roomDensityMultiplier =
        params.roomScope === "kitchen" ? 1.35 : params.roomScope === "living_dining" ? 1.08 : 1.0;

    const rawTotal =
        targetAreaSqFt *
        tier.baseCostPerSqFtKES *
        style.costMultiplier *
        scaleFactor *
        roomDensityMultiplier;

    // Round to nearest KES 5,000
    const totalEstimateKES = Math.max(120_000, Math.round(rawTotal / 5_000) * 5_000);

    // Split across realistic BOQ categories depending on fit-out tier
    const shares =
        params.fitOutTier === "furnishing_only"
            ? { furniture: 0.56, joinery: 0.16, lighting: 0.14, civil: 0.04, fee: 0.10 }
            : params.fitOutTier === "light_refresh"
            ? { furniture: 0.40, joinery: 0.24, lighting: 0.14, civil: 0.12, fee: 0.10 }
            : { furniture: 0.28, joinery: 0.26, lighting: 0.13, civil: 0.23, fee: 0.10 };

    const furnitureKES = Math.round((totalEstimateKES * shares.furniture) / 1_000) * 1_000;
    const joineryKES = Math.round((totalEstimateKES * shares.joinery) / 1_000) * 1_000;
    const lightingKES = Math.round((totalEstimateKES * shares.lighting) / 1_000) * 1_000;
    const civilKES = Math.round((totalEstimateKES * shares.civil) / 1_000) * 1_000;
    const designFeeKES = Math.max(25_000, totalEstimateKES - (furnitureKES + joineryKES + lightingKES + civilKES));

    const lineItems: StagingBudgetLineItem[] = [
        {
            id: "boq_furniture",
            label: `Loose Furniture, Upholstery & ${style.name} Curated Pieces`,
            category: "furniture",
            amountKES: furnitureKES,
            note:
                params.roomScope === "full_home"
                    ? `Covers lounge, dining & ${beds} bedroom suite(s) in ${style.name} specification`
                    : `Custom ${scope.label.toLowerCase()} seating, tables, soft rugs & drapery`,
        },
        {
            id: "boq_joinery",
            label: "Bespoke Timber Joinery, Cabinetry & Wall Panelling",
            category: "joinery",
            amountKES: joineryKES,
            note: "Kiln-dried hardwood / moisture-resistant MDF cabinetry, wardrobes & media units",
        },
        {
            id: "boq_lighting",
            label: "Architectural Lighting, Curtains & Smart Scene Controls",
            category: "lighting_smart",
            amountKES: lightingKES,
            note: "Warm 2700K–3000K LED coves, statement pendants, sheer/blackout tracks & smart dimmers",
        },
        {
            id: "boq_civil",
            label: "Surface Finishes, Mineral Paint, Stone & Sanitary Upgrades",
            category: "civil_finishes",
            amountKES: civilKES,
            note:
                params.fitOutTier === "furnishing_only"
                    ? "Touch-up painting, wall mounting & protective surface sealing"
                    : "Limewash/micro-cement walls, tile/flooring works, quartz tops & MEP fittings",
        },
        {
            id: "boq_design_fee",
            label: "Interior Architect Concept, 3D Renders & Site Supervision (10%)",
            category: "design_fee",
            amountKES: designFeeKES,
            note: "Procurement management, Kenyan artisan sourcing & snag-free installation",
        },
    ];

    const basePropertyValue =
        params.propertyPriceKES && params.propertyPriceKES > 1_000_000
            ? params.propertyPriceKES
            : safeTotalSqFt * 13_500;

    // Furnishing / renovating a full home delivers full yield boost; single room delivers proportional boost
    const effectiveBoostPct = style.rentalYieldBoostPct * (0.35 + 0.65 * scope.areaShareFactor);
    const estimatedMonthlyRentUpliftKES =
        Math.round(((basePropertyValue * (effectiveBoostPct / 100)) / 12) / 500) * 500;

    // Typical resale value retention / uplift (1.25x–1.45x of smart fit-out capex)
    const upliftMultiplier = params.fitOutTier === "full_renovation" ? 1.38 : 1.26;
    const estimatedResaleValueUpliftKES = Math.round((totalEstimateKES * upliftMultiplier) / 10_000) * 10_000;

    const paybackMonthsEstimate =
        estimatedMonthlyRentUpliftKES > 0
            ? Math.max(8, Math.round(totalEstimateKES / estimatedMonthlyRentUpliftKES))
            : 36;

    const estimatedTimelineWeeks = Math.max(
        2,
        Math.round(tier.weeksBase * (params.roomScope === "full_home" ? 1.25 : 0.75))
    );

    return {
        styleId: style.id,
        roomScope: scope.id,
        fitOutTier: tier.id,
        targetAreaSqFt,
        totalEstimateKES,
        lowEstimateKES: Math.round((totalEstimateKES * 0.9) / 5_000) * 5_000,
        highEstimateKES: Math.round((totalEstimateKES * 1.12) / 5_000) * 5_000,
        estimatedTimelineWeeks,
        estimatedMonthlyRentUpliftKES,
        estimatedResaleValueUpliftKES,
        paybackMonthsEstimate,
        lineItems,
    };
}

export function generateStagingBOQDocument(params: {
    propertyTitle: string;
    location: string;
    style: StagingStylePreset;
    budget: StagingBudgetBreakdown;
    aiConceptNotes: string[];
}): string {
    const scopeLabel =
        ROOM_SCOPE_OPTIONS.find((r) => r.id === params.budget.roomScope)?.label || params.budget.roomScope;
    const tierLabel =
        FIT_OUT_TIER_OPTIONS.find((t) => t.id === params.budget.fitOutTier)?.label || params.budget.fitOutTier;

    const lines = params.budget.lineItems
        .map(
            (item, i) =>
                `${i + 1}. ${item.label}\n   Estimate: KES ${item.amountKES.toLocaleString()}\n   Scope:    ${item.note}`
        )
        .join("\n\n");

    return [
        "======================================================================",
        "        ESTATEVUE AI VIRTUAL STAGING — DESIGN BRIEF & FIT-OUT BOQ     ",
        "======================================================================",
        `Property:         ${params.propertyTitle}`,
        `Location:         ${params.location}`,
        `Design Aesthetic: ${params.style.name} (${params.style.tagline})`,
        `Target Space:     ${scopeLabel} (~${params.budget.targetAreaSqFt.toLocaleString()} sqft)`,
        `Fit-Out Tier:     ${tierLabel}`,
        `Est. Timeline:    ${params.budget.estimatedTimelineWeeks} Weeks`,
        "----------------------------------------------------------------------",
        "",
        "ARCHITECTURAL RESTYLING NOTES:",
        ...params.aiConceptNotes.map((n) => `• ${n}`),
        "",
        "SIGNATURE MATERIALS PALETTE:",
        ...params.style.materialsSummary.map((m) => `• ${m}`),
        "",
        "ITEMIZED BILL OF QUANTITIES (INDICATIVE KES):",
        "",
        lines,
        "",
        "----------------------------------------------------------------------",
        `TOTAL ESTIMATED BUDGET:   KES ${params.budget.totalEstimateKES.toLocaleString()}`,
        `Indicative Market Band:   KES ${params.budget.lowEstimateKES.toLocaleString()} – KES ${params.budget.highEstimateKES.toLocaleString()}`,
        `Est. Monthly Rent Uplift: +KES ${params.budget.estimatedMonthlyRentUpliftKES.toLocaleString()} / month`,
        `Est. Resale Value Uplift: +KES ${params.budget.estimatedResaleValueUpliftKES.toLocaleString()}`,
        "======================================================================",
    ].join("\n");
}
