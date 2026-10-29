/**
 * Off-Plan Developments & Construction Milestone Tracker Data & Calculators
 * Tailored for Nairobi & Mombasa flagship residential & mixed-use developments.
 */

export type ProjectConstructionStatus =
    | "launching"
    | "under_construction"
    | "topping_out"
    | "nearing_handover";

export interface DeveloperProfile {
    name: string;
    yearsActive: number;
    deliveredProjects: number;
    ncaRegNumber: string; // National Construction Authority registration
    escrowBank: string;
    trackRecordSummary: string;
}

export interface ProjectUnitTypology {
    id: string;
    label: string; // e.g. "2 Bedroom Executive + DSQ"
    bedrooms: number;
    bathrooms: number;
    sizeSqm: number;
    sizeSqft: number;
    priceKES: number;
    totalUnits: number;
    availableUnits: number;
    estimatedMonthlyRentKES: number;
}

export interface PaymentPlanTranche {
    id: string;
    stageLabel: string;
    percent: number;
    timing: string;
    milestoneTrigger: string;
}

export interface ConstructionMilestone {
    id: string;
    phaseNumber: number;
    title: string;
    targetDate: string;
    completedDate?: string;
    status: "completed" | "in_progress" | "upcoming";
    progressPct: number;
    engineerSignOff: string;
    summary: string;
    photos: string[];
}

export interface OffPlanProject {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    city: "Nairobi" | "Mombasa";
    neighborhood: string;
    address: string;
    heroImage: string;
    galleryImages: string[];
    status: ProjectConstructionStatus;
    overallProgressPct: number;
    launchDate: string;
    completionQuarter: string;
    escrowProtected: boolean;
    sectionalTitleCompliant: boolean; // Sectional Properties Act 2020
    earlyBirdDiscountPct: number;
    expectedRentalYieldPct: number;
    projectedAppreciationPct: number;
    reservationFeeKES: number;
    developer: DeveloperProfile;
    leadAgent: {
        name: string;
        phone: string;
        email: string;
        avatar: string;
    };
    unitMix: ProjectUnitTypology[];
    paymentPlan: PaymentPlanTranche[];
    milestones: ConstructionMilestone[];
    amenities: string[];
}

export interface ComputedTrancheAmount extends PaymentPlanTranche {
    amountKES: number;
    cumulativePct: number;
    cumulativeKES: number;
}

/**
 * Calculates exact KES instalment figures for any unit typology price across the project's staged payment plan.
 */
export function calculateStagedPaymentSchedule(
    unitPriceKES: number,
    paymentPlan: PaymentPlanTranche[]
): ComputedTrancheAmount[] {
    let runningPct = 0;
    let runningKES = 0;

    return paymentPlan.map((tranche) => {
        const amountKES = Math.round(unitPriceKES * (tranche.percent / 100));
        runningPct += tranche.percent;
        runningKES += amountKES;
        return {
            ...tranche,
            amountKES,
            cumulativePct: Math.min(100, runningPct),
            cumulativeKES: runningKES,
        };
    });
}

export function getStartingPriceKES(project: OffPlanProject): number {
    if (!project.unitMix.length) return 0;
    return Math.min(...project.unitMix.map((u) => u.priceKES));
}

export function getTotalAvailableUnits(project: OffPlanProject): { available: number; total: number } {
    return project.unitMix.reduce(
        (acc, u) => ({
            available: acc.available + u.availableUnits,
            total: acc.total + u.totalUnits,
        }),
        { available: 0, total: 0 }
    );
}

export const offPlanProjects: OffPlanProject[] = [
    {
        id: "proj-azure-westlands",
        slug: "the-azure-sky-residences-westlands",
        name: "The Azure Sky Residences",
        tagline: "Iconic 24-storey diplomatic & serviced apartment tower off General Mathenge, Westlands",
        description:
            "Designed for global executives and high-yield short-stay investors, The Azure Sky Residences combines heated sky-deck infinity pools, smart home automation, and ring-fenced Stanbic Escrow protection. Compliant with the Sectional Properties Act 2020 for direct individual apartment titles at handover.",
        city: "Nairobi",
        neighborhood: "Westlands",
        address: "Off General Mathenge Drive, Westlands",
        heroImage: "/images/property-2.png",
        galleryImages: ["/images/property-2.png", "/images/property-4.png", "/images/property-6.png"],
        status: "under_construction",
        overallProgressPct: 64,
        launchDate: "2025-09-01",
        completionQuarter: "Q3 2027",
        escrowProtected: true,
        sectionalTitleCompliant: true,
        earlyBirdDiscountPct: 6,
        expectedRentalYieldPct: 11.4,
        projectedAppreciationPct: 24,
        reservationFeeKES: 100_000,
        developer: {
            name: "Vanguard Horizon Developments Ltd",
            yearsActive: 14,
            deliveredProjects: 9,
            ncaRegNumber: "NCA-1 / DEV-40928",
            escrowBank: "Stanbic Bank Kenya — Project Escrow",
            trackRecordSummary: "Delivered 1,150+ luxury apartments across Westlands, Riverside & Kileleshwa on schedule.",
        },
        leadAgent: {
            name: "Sarah Kimani",
            phone: "+254 712 345 678",
            email: "sarah@estatevue.com",
            avatar: "/images/agent-1.png",
        },
        unitMix: [
            {
                id: "az-1br",
                label: "1 Bedroom Diplomatic Suite",
                bedrooms: 1,
                bathrooms: 1,
                sizeSqm: 72,
                sizeSqft: 775,
                priceKES: 11_800_000,
                totalUnits: 48,
                availableUnits: 9,
                estimatedMonthlyRentKES: 115_000,
            },
            {
                id: "az-2br",
                label: "2 Bedroom All-En-Suite + Study",
                bedrooms: 2,
                bathrooms: 2,
                sizeSqm: 118,
                sizeSqft: 1270,
                priceKES: 18_500_000,
                totalUnits: 60,
                availableUnits: 17,
                estimatedMonthlyRentKES: 175_000,
            },
            {
                id: "az-3br",
                label: "3 Bedroom Executive + DSQ",
                bedrooms: 3,
                bathrooms: 4,
                sizeSqm: 176,
                sizeSqft: 1894,
                priceKES: 27_900_000,
                totalUnits: 36,
                availableUnits: 11,
                estimatedMonthlyRentKES: 250_000,
            },
            {
                id: "az-4br-pent",
                label: "4 Bedroom Sky Duplex Penthouse",
                bedrooms: 4,
                bathrooms: 5,
                sizeSqm: 295,
                sizeSqft: 3175,
                priceKES: 49_500_000,
                totalUnits: 6,
                availableUnits: 2,
                estimatedMonthlyRentKES: 430_000,
            },
        ],
        paymentPlan: [
            {
                id: "p1",
                stageLabel: "Reservation & Sale Agreement Deposit",
                percent: 20,
                timing: "Upon Booking (Day 0–14)",
                milestoneTrigger: "Executed LSK Sale Agreement & Escrow Deposit Receipt",
            },
            {
                id: "p2",
                stageLabel: "Construction Tranche 1 — Superstructure 12th Floor",
                percent: 20,
                timing: "Month 4",
                milestoneTrigger: "Structural Engineer Slab Certificate (Completed)",
            },
            {
                id: "p3",
                stageLabel: "Construction Tranche 2 — Roof Slab Topping Out",
                percent: 20,
                timing: "Month 9",
                milestoneTrigger: "24th Floor Roof Slab & Waterproofing Sign-Off",
            },
            {
                id: "p4",
                stageLabel: "Construction Tranche 3 — Facade, Glazing & MEP",
                percent: 20,
                timing: "Month 14",
                milestoneTrigger: "High-speed lifts, acoustic curtain walling & joinery",
            },
            {
                id: "p5",
                stageLabel: "Final Handover & Sectional Title Registration",
                percent: 20,
                timing: "Q3 2027 Handover",
                milestoneTrigger: "Occupation Certificate, Snagging Sign-Off & Key Release",
            },
        ],
        milestones: [
            {
                id: "m1",
                phaseNumber: 1,
                title: "Excavation, 3-Level Basement & Piling Foundation",
                targetDate: "Dec 2025",
                completedDate: "14 Dec 2025",
                status: "completed",
                progressPct: 100,
                engineerSignOff: "Eng. P. Mwangi (EBK Reg #A2914) — Certified",
                summary: "Contiguous bored piling and 3 subterranean parking levels completed with waterproof tanking.",
                photos: ["/images/property-6.png", "/images/property-2.png"],
            },
            {
                id: "m2",
                phaseNumber: 2,
                title: "Podium Amenities Deck & Floors 1–12 Structural Frame",
                targetDate: "May 2026",
                completedDate: "08 May 2026",
                status: "completed",
                progressPct: 100,
                engineerSignOff: "Eng. P. Mwangi (EBK Reg #A2914) — Concrete Cube Test 42 MPa Pass",
                summary: "Post-tensioned concrete slabs through Level 12 completed ahead of schedule; sample show-house opened on Level 2.",
                photos: ["/images/property-4.png", "/images/property-2.png"],
            },
            {
                id: "m3",
                phaseNumber: 3,
                title: "Floors 13–24 Superstructure & First-Fix MEP",
                targetDate: "Nov 2026",
                status: "in_progress",
                progressPct: 78,
                engineerSignOff: "Active Monthly Inspection — Level 20 Slab Poured (Oct 2026)",
                summary: "Formwork currently advancing on Level 21; concealed plumbing risers and electrical conduits installed up to Level 15.",
                photos: ["/images/property-2.png", "/images/property-4.png"],
            },
            {
                id: "m4",
                phaseNumber: 4,
                title: "Double-Glazed Curtain Facade, Lifts & European Kitchen Fit-Out",
                targetDate: "Apr 2027",
                status: "upcoming",
                progressPct: 0,
                engineerSignOff: "Scheduled — Kone Elevators & Bosch Appliances Procured",
                summary: "Installation of solar-control low-E glass facade, 4 high-speed passenger lifts, and porcelain interior finishes.",
                photos: ["/images/property-4.png"],
            },
            {
                id: "m5",
                phaseNumber: 5,
                title: "County Occupation Certificate, Snagging & Sectional Titles",
                targetDate: "Sep 2027",
                status: "upcoming",
                progressPct: 0,
                engineerSignOff: "Scheduled Handover",
                summary: "Independent snagging window for local and diaspora buyers followed by ArdhiSasa sectional title issuance.",
                photos: ["/images/property-2.png"],
            },
        ],
        amenities: [
            "Heated Rooftop Infinity Pool",
            "Co-Working & Private Boardroom Lounge",
            "Full Backup Generator & Borehole",
            "Smart Keyless Access (Airbnb Ready)",
            "Sky Gym, Sauna & Steam Room",
            "24/7 Biometric Security & CCTV",
            "EV Charging Bays",
            "On-Site Serviced Rental Management",
        ],
    },
    {
        id: "proj-palm-crest-nyali",
        slug: "palm-crest-oceanfront-villas-nyali",
        name: "Palm Crest Oceanfront Residences",
        tagline: "Boutique gated enclave of Swahili-modern coastal villas & sea-facing penthouses in Nyali",
        description:
            "Set 180 meters from Nyali's white coral shoreline, Palm Crest blends coral-stone Swahili craftsmanship with hurricane-rated panoramic glazing, private plunge pools, and solar-hybrid microgrid independence.",
        city: "Mombasa",
        neighborhood: "Nyali",
        address: "Links Road / Beach Access Lane, Nyali",
        heroImage: "/images/property-1.png",
        galleryImages: ["/images/property-1.png", "/images/property-5.png", "/images/property-3.png"],
        status: "topping_out",
        overallProgressPct: 82,
        launchDate: "2025-04-15",
        completionQuarter: "Q1 2027",
        escrowProtected: true,
        sectionalTitleCompliant: true,
        earlyBirdDiscountPct: 4,
        expectedRentalYieldPct: 12.8,
        projectedAppreciationPct: 21,
        reservationFeeKES: 150_000,
        developer: {
            name: "Bahari Luxury Estates Kenya",
            yearsActive: 11,
            deliveredProjects: 6,
            ncaRegNumber: "NCA-1 / MSA-19304",
            escrowBank: "KCB Bank Kenya — Custody Escrow",
            trackRecordSummary: "Specialists in marine-grade coastal villas and holiday resort residences in Nyali & Diani.",
        },
        leadAgent: {
            name: "David Ochieng",
            phone: "+254 722 987 654",
            email: "david@estatevue.com",
            avatar: "/images/agent-2.png",
        },
        unitMix: [
            {
                id: "pc-2br",
                label: "2 Bedroom Ocean-Breeze Terrace Suite",
                bedrooms: 2,
                bathrooms: 3,
                sizeSqm: 142,
                sizeSqft: 1528,
                priceKES: 21_500_000,
                totalUnits: 24,
                availableUnits: 5,
                estimatedMonthlyRentKES: 210_000,
            },
            {
                id: "pc-3br",
                label: "3 Bedroom Sea-View Residence + DSQ",
                bedrooms: 3,
                bathrooms: 4,
                sizeSqm: 210,
                sizeSqft: 2260,
                priceKES: 33_000_000,
                totalUnits: 18,
                availableUnits: 4,
                estimatedMonthlyRentKES: 310_000,
            },
            {
                id: "pc-5br-villa",
                label: "5 Bedroom Coral Villa + Private Plunge Pool",
                bedrooms: 5,
                bathrooms: 6,
                sizeSqm: 390,
                sizeSqft: 4198,
                priceKES: 68_000_000,
                totalUnits: 8,
                availableUnits: 2,
                estimatedMonthlyRentKES: 620_000,
            },
        ],
        paymentPlan: [
            {
                id: "pc-p1",
                stageLabel: "Booking & Sale Agreement Deposit",
                percent: 25,
                timing: "Upon Execution",
                milestoneTrigger: "Signed Agreement & KCB Escrow Confirmation",
            },
            {
                id: "pc-p2",
                stageLabel: "Interior Finishes & MEP Commissioning",
                percent: 55,
                timing: "2 Quarterly Calls (27.5% × 2)",
                milestoneTrigger: "Italian tiling, marine-grade aluminium glazing & AC commissioning",
            },
            {
                id: "pc-p3",
                stageLabel: "Handover & Title Transfer Balance",
                percent: 20,
                timing: "Q1 2027 Handover",
                milestoneTrigger: "Final Snagging Clearance & Key Handover",
            },
        ],
        milestones: [
            {
                id: "pc-m1",
                phaseNumber: 1,
                title: "Coral Bedrock Substructure & Desalination Plant",
                targetDate: "Sep 2025",
                completedDate: "22 Sep 2025",
                status: "completed",
                progressPct: 100,
                engineerSignOff: "QS & Structural Sign-Off — Completed",
                summary: "Foundation rafts and reverse-osmosis freshwater plant commissioned.",
                photos: ["/images/property-1.png"],
            },
            {
                id: "pc-m2",
                phaseNumber: 2,
                title: "Roofing Topping-Out & Infinity Pool Shell",
                targetDate: "Jun 2026",
                completedDate: "19 Jun 2026",
                status: "completed",
                progressPct: 100,
                engineerSignOff: "BORAQS Architect Certificate #7741",
                summary: "All structural shells topped out; oceanfront lagoon pool hydrostatic test passed.",
                photos: ["/images/property-5.png", "/images/property-1.png"],
            },
            {
                id: "pc-m3",
                phaseNumber: 3,
                title: "Interior Hardwood Joinery, Solar Hybrid & Landscaping",
                targetDate: "Dec 2026",
                status: "in_progress",
                progressPct: 68,
                engineerSignOff: "Active Fit-Out — Oct 2026 Site Audit",
                summary: "Mvule hardwood wardrobes, VRV air-conditioning, and 120kWp solar array installation underway.",
                photos: ["/images/property-1.png", "/images/property-3.png"],
            },
            {
                id: "pc-m4",
                phaseNumber: 4,
                title: "Snagging, Holiday Turnkey Furnishing & Handover",
                targetDate: "Mar 2027",
                status: "upcoming",
                progressPct: 0,
                engineerSignOff: "Target Q1 2027",
                summary: "Optional turnkey holiday-rental furnishing pack & title handover.",
                photos: ["/images/property-5.png"],
            },
        ],
        amenities: [
            "Private Beach Access Path",
            "Saltwater Lagoon & Plunge Pools",
            "120kWp Solar Hybrid + Desalination",
            "Turnkey Holiday Rental Management",
            "Clubhouse & Oceanfront Sundowner Deck",
            "24/7 Guarded Coastal Enclave",
        ],
    },
    {
        id: "proj-verdant-karen",
        slug: "verdant-grove-gated-villas-karen",
        name: "Verdant Grove Karen",
        tagline: "Low-density 10-acre gated sanctuary of half-acre contemporary villas near Karen Country Club",
        description:
            "Crafted for discerning families and returning diaspora homeowners seeking generational land value in Karen. Each 4- and 5-bedroom residence sits on its own landscaped half-acre garden within an indigenous forest conservancy.",
        city: "Nairobi",
        neighborhood: "Karen",
        address: "Miotoni / Karen Road Corridor, Karen",
        heroImage: "/images/property-3.png",
        galleryImages: ["/images/property-3.png", "/images/property-5.png", "/images/property-1.png"],
        status: "launching",
        overallProgressPct: 28,
        launchDate: "2026-06-01",
        completionQuarter: "Q2 2028",
        escrowProtected: true,
        sectionalTitleCompliant: true,
        earlyBirdDiscountPct: 8,
        expectedRentalYieldPct: 7.6,
        projectedAppreciationPct: 29,
        reservationFeeKES: 250_000,
        developer: {
            name: "Acacia Heritage Homes",
            yearsActive: 18,
            deliveredProjects: 12,
            ncaRegNumber: "NCA-1 / NRB-08812",
            escrowBank: "Absa Bank Kenya — Stakeholder Escrow",
            trackRecordSummary: "Renowned low-density gated community builder across Karen, Runda & Loresho.",
        },
        leadAgent: {
            name: "Grace Muthoni",
            phone: "+254 733 456 789",
            email: "grace@estatevue.com",
            avatar: "/images/agent-3.png",
        },
        unitMix: [
            {
                id: "vg-4br",
                label: "4 Bedroom Garden Villa + 2 DSQ (0.5 Acre)",
                bedrooms: 4,
                bathrooms: 5,
                sizeSqm: 385,
                sizeSqft: 4144,
                priceKES: 64_000_000,
                totalUnits: 12,
                availableUnits: 7,
                estimatedMonthlyRentKES: 380_000,
            },
            {
                id: "vg-5br",
                label: "5 Bedroom Signature Manor + Pavilion & Pool (0.5 Acre)",
                bedrooms: 5,
                bathrooms: 6,
                sizeSqm: 490,
                sizeSqft: 5274,
                priceKES: 86_000_000,
                totalUnits: 8,
                availableUnits: 5,
                estimatedMonthlyRentKES: 510_000,
            },
        ],
        paymentPlan: [
            {
                id: "vg-p1",
                stageLabel: "Early-Bird Reservation & Sale Agreement",
                percent: 20,
                timing: "Upon Signing",
                milestoneTrigger: "Sub-lease / Freehold Parcel Allocation & Absa Escrow Receipt",
            },
            {
                id: "vg-p2",
                stageLabel: "Civil Infrastructure & Villa Ground Slab",
                percent: 20,
                timing: "Month 5",
                milestoneTrigger: "Cabro boulevard, borehole reticulation & ground floor slab",
            },
            {
                id: "vg-p3",
                stageLabel: "First Floor & Roof Structure",
                percent: 20,
                timing: "Month 11",
                milestoneTrigger: "Structural walling & pitched stone-coated steel/clay roof",
            },
            {
                id: "vg-p4",
                stageLabel: "Bespoke Interior Finishes & Solar Microgrid",
                percent: 20,
                timing: "Month 17",
                milestoneTrigger: "Buyer finish customization palette installed",
            },
            {
                id: "vg-p5",
                stageLabel: "Completion, Snagging & Sub-Title Transfer",
                percent: 20,
                timing: "Q2 2028 Handover",
                milestoneTrigger: "Independent surveyor snagging & key handover",
            },
        ],
        milestones: [
            {
                id: "vg-m1",
                phaseNumber: 1,
                title: "NEMA EIA Approval, Perimeter Wall & Borehole Drilling",
                targetDate: "Aug 2026",
                completedDate: "28 Aug 2026",
                status: "completed",
                progressPct: 100,
                engineerSignOff: "NEMA License #NEMA/EIA/2026-812 & Hydrologist Sign-Off",
                summary: "240m solar-equipped borehole yielding 18m³/hr completed alongside perimeter security wall.",
                photos: ["/images/property-3.png"],
            },
            {
                id: "vg-m2",
                phaseNumber: 2,
                title: "Internal Cabro Roads, Biodigesters & Show-Villa Shell",
                targetDate: "Jan 2027",
                status: "in_progress",
                progressPct: 45,
                engineerSignOff: "In Progress — Phase 1 Plots 1–6 Foundations Cast",
                summary: "Underground power/fiber ducting laid; show-villa first-floor slab scheduled for November.",
                photos: ["/images/property-3.png", "/images/property-5.png"],
            },
            {
                id: "vg-m3",
                phaseNumber: 3,
                title: "Phase 1 & 2 Superstructure & Residents' Nature Clubhouse",
                targetDate: "Oct 2027",
                status: "upcoming",
                progressPct: 0,
                engineerSignOff: "Upcoming",
                summary: "Full structural framing of remaining villas and heated lap-pool clubhouse.",
                photos: ["/images/property-5.png"],
            },
            {
                id: "vg-m4",
                phaseNumber: 4,
                title: "Landscaping, Snagging & Individual Title Handover",
                targetDate: "May 2028",
                status: "upcoming",
                progressPct: 0,
                engineerSignOff: "Target Q2 2028",
                summary: "Mature indigenous garden planting, third-party snagging, and possession.",
                photos: ["/images/property-3.png"],
            },
        ],
        amenities: [
            "Half-Acre Private Gardens",
            "10kW Solar + Battery Storage per Villa",
            "Private Borehole & Water Purification",
            "Residents' Clubhouse & Heated Lap Pool",
            "2km Forest Jogging Trail",
            "Acoustic Home Office Pod",
        ],
    },
];

export function getOffPlanProjectBySlug(slug: string): OffPlanProject | undefined {
    return offPlanProjects.find((p) => p.slug === slug || p.id === slug);
}
