/* ========================================
   BLOG / MARKET INSIGHTS
   ======================================== */

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // HTML content
    image: string;
    category: "market-trends" | "investment" | "buying-guide" | "neighborhood" | "lifestyle";
    author: {
        name: string;
        avatar: string;
        role: string;
    };
    publishedAt: string; // ISO date
    readTime: number; // minutes
    featured?: boolean;
    tags: string[];
}

export const blogCategories = [
    { id: "all", label: "All Articles", icon: "📰" },
    { id: "market-trends", label: "Market Trends", icon: "📈" },
    { id: "investment", label: "Investment Tips", icon: "💰" },
    { id: "buying-guide", label: "Buying Guides", icon: "🏠" },
    { id: "neighborhood", label: "Neighborhoods", icon: "📍" },
    { id: "lifestyle", label: "Lifestyle", icon: "✨" },
];

export const blogPosts: BlogPost[] = [
    {
        id: "1",
        slug: "nairobi-real-estate-market-outlook-2026",
        title: "Nairobi Real Estate Market Outlook: What to Expect in 2026",
        excerpt: "With infrastructure investments and shifting buyer preferences, Nairobi's property market is poised for significant growth. Here's our complete analysis of upcoming trends.",
        content: `
            <p>The Nairobi real estate market continues to evolve as Kenya's economy stabilizes and new infrastructure projects reshape the urban landscape. As we look ahead to 2026, several key trends are emerging that savvy investors and homebuyers should pay attention to.</p>
            
            <h2>Key Market Drivers</h2>
            <p>The completion of the Nairobi Expressway has dramatically improved connectivity between the CBD and the western suburbs, driving up property values along the corridor. Areas like Westlands, Kilimani, and Lavington have seen average price increases of 8-12% year-over-year.</p>
            
            <h2>Emerging Hotspots</h2>
            <p>Several neighborhoods are emerging as the next big investment destinations:</p>
            <ul>
                <li><strong>Kitisuru</strong> — Eco-friendly developments are attracting environmentally conscious buyers</li>
                <li><strong>Ruaka</strong> — Affordable apartments with good returns on investment</li>
                <li><strong>Syokimau</strong> — SGR connectivity making it a commuter haven</li>
            </ul>
            
            <h2>Price Predictions</h2>
            <p>Analysts expect the following trends in 2026:</p>
            <ul>
                <li>Apartment prices in Westlands: +6-8% growth</li>
                <li>Karen estate homes: Stable with +3-5% growth</li>
                <li>Mombasa coastal properties: +10-15% growth driven by tourism recovery</li>
            </ul>
            
            <h2>What This Means for Buyers</h2>
            <p>Now is an excellent time to enter the market, particularly in emerging neighborhoods where prices haven't fully caught up with infrastructure improvements. Focus on areas with upcoming road projects, malls, or transit stations for the best long-term appreciation.</p>
        `,
        image: "/images/property-2.png",
        category: "market-trends",
        author: {
            name: "James Mwangi",
            avatar: "/images/property-1.png",
            role: "Senior Market Analyst",
        },
        publishedAt: "2026-08-10T09:00:00Z",
        readTime: 6,
        featured: true,
        tags: ["Nairobi", "Market Trends", "2026", "Investment"],
    },
    {
        id: "2",
        slug: "first-time-homebuyer-guide-kenya",
        title: "The Ultimate First-Time Homebuyer's Guide for Kenya",
        excerpt: "Everything you need to know about buying your first property in Kenya — from financing options to legal requirements and common pitfalls to avoid.",
        content: `
            <p>Buying your first home is one of life's most exciting milestones, but it can also be one of the most intimidating. This comprehensive guide walks you through every step of the Kenyan property buying process.</p>
            
            <h2>Step 1: Assess Your Finances</h2>
            <p>Before you start browsing properties, understand your financial position. Most Kenyan banks require a minimum deposit of 10-20% of the purchase price. Factor in additional costs like legal fees (1-2%), stamp duty (2-4%), and valuation fees.</p>
            
            <h2>Step 2: Get Pre-Approved for a Mortgage</h2>
            <p>Visit multiple banks to compare interest rates and terms. Key players include KCB, Equity Bank, Stanbic, and NCBA. Current rates range from 12-15% per annum for 20-25 year terms.</p>
            
            <h2>Step 3: Choose Your Location Wisely</h2>
            <p>Consider your commute, nearby schools (if you have children), security, and future development plans for the area. Properties near upcoming infrastructure projects tend to appreciate faster.</p>
            
            <h2>Step 4: Due Diligence</h2>
            <p>Always verify:</p>
            <ul>
                <li>Title deed authenticity at the lands registry</li>
                <li>Any encumbrances or caveats on the property</li>
                <li>Land rates clearance certificate</li>
                <li>Approved building plans (for apartments)</li>
            </ul>
            
            <h2>Step 5: Close the Deal</h2>
            <p>Engage a reputable lawyer to handle the conveyancing process. This typically takes 90-120 days from offer acceptance to key handover.</p>
        `,
        image: "/images/property-3.png",
        category: "buying-guide",
        author: {
            name: "Amina Ochieng",
            avatar: "/images/property-4.png",
            role: "Property Advisor",
        },
        publishedAt: "2026-08-08T14:00:00Z",
        readTime: 8,
        featured: true,
        tags: ["First-Time Buyer", "Guide", "Mortgage", "Legal"],
    },
    {
        id: "3",
        slug: "top-5-investment-areas-mombasa-2026",
        title: "Top 5 Investment Areas in Mombasa for Maximum Returns",
        excerpt: "Mombasa's coastal property market is booming. Discover the five neighborhoods offering the best rental yields and capital appreciation.",
        content: `
            <p>Mombasa's real estate market has been one of Kenya's best-performing sectors, driven by tourism recovery, infrastructure improvements, and growing demand for coastal living.</p>
            
            <h2>1. Nyali — The Prime Choice</h2>
            <p>Nyali remains the gold standard for Mombasa investments. Rental yields average 7-9% for furnished apartments, with consistent demand from tourists and expatriates.</p>
            
            <h2>2. Diani Beach — Premium Returns</h2>
            <p>Africa's leading beach destination offers exceptional Airbnb returns during peak seasons (December-March). Beachfront villas can generate up to KES 50,000 per night.</p>
            
            <h2>3. Shanzu — Emerging Star</h2>
            <p>More affordable than Nyali but rapidly developing, Shanzu offers 10-12% rental yields for new apartment developments near beach resorts.</p>
            
            <h2>4. Kilifi — The Long Game</h2>
            <p>Kilifi is attracting a creative, international community. Land prices have doubled in 5 years, making it ideal for plot purchases and custom developments.</p>
            
            <h2>5. Watamu — Eco-Tourism Hub</h2>
            <p>With marine conservation efforts boosting tourism, Watamu properties offer unique eco-resort investment opportunities with returns of 8-11%.</p>
        `,
        image: "/images/property-1.png",
        category: "investment",
        author: {
            name: "David Kiptoo",
            avatar: "/images/property-5.png",
            role: "Investment Strategist",
        },
        publishedAt: "2026-08-05T10:00:00Z",
        readTime: 5,
        tags: ["Mombasa", "Investment", "Coastal", "Returns"],
    },
    {
        id: "4",
        slug: "karen-neighborhood-deep-dive",
        title: "Living in Karen: A Complete Neighborhood Guide",
        excerpt: "An in-depth look at what makes Karen one of Nairobi's most sought-after residential areas — schools, amenities, security, and property options.",
        content: `
            <p>Named after Karen Blixen, the Danish author of "Out of Africa," Karen has long been synonymous with upscale suburban living in Nairobi. Let's explore what makes this neighborhood special.</p>
            
            <h2>The Karen Lifestyle</h2>
            <p>Karen offers a lifestyle that's hard to find in any other Nairobi neighborhood. Sprawling compounds, equestrian centers, and proximity to Nairobi National Park create a unique semi-rural atmosphere just 20 minutes from the CBD.</p>
            
            <h2>Property Options</h2>
            <p>The market ranges from contemporary townhouses starting at KES 15M to grand mansions exceeding KES 120M. Most properties sit on 0.5-5 acre plots with mature gardens, swimming pools, and staff quarters.</p>
            
            <h2>Schools & Education</h2>
            <p>Karen is home to some of Kenya's finest schools including Brookhouse School, Banda School, and the German School Nairobi. This makes it a top choice for families.</p>
            
            <h2>Investment Potential</h2>
            <p>While not the highest-yielding area for rental income, Karen offers excellent capital preservation and steady 3-5% annual appreciation. It's a safe haven for long-term wealth preservation.</p>
        `,
        image: "/images/property-4.png",
        category: "neighborhood",
        author: {
            name: "Grace Wanjiku",
            avatar: "/images/property-2.png",
            role: "Neighborhood Specialist",
        },
        publishedAt: "2026-08-01T08:00:00Z",
        readTime: 7,
        tags: ["Karen", "Nairobi", "Neighborhood Guide", "Schools"],
    },
    {
        id: "5",
        slug: "smart-home-trends-kenya",
        title: "Smart Home Trends Transforming Kenyan Real Estate",
        excerpt: "From solar-powered homes to smart security systems, technology is reshaping how Kenyans build and live. Discover the latest trends.",
        content: `
            <p>The rise of smart home technology in Kenya is not just a luxury trend — it's becoming a practical necessity for modern homeowners looking to save on utilities and enhance security.</p>
            
            <h2>Solar Power Integration</h2>
            <p>With Kenya's abundant sunshine, solar power systems are becoming standard in new developments. A typical 5kW system costs KES 500,000-800,000 and pays for itself in 3-4 years through electricity savings.</p>
            
            <h2>Smart Security</h2>
            <p>CCTV systems with mobile monitoring, automated gates, and motion-sensor lighting are now expected features in upscale developments. Cloud-based security solutions cost as little as KES 5,000/month.</p>
            
            <h2>Water Harvesting</h2>
            <p>Rainwater harvesting systems are becoming mandatory in many Nairobi estates. A 10,000-liter system with filtration can supply a household for months during dry seasons.</p>
            
            <h2>Home Automation</h2>
            <p>Smart lighting, automated curtains, and climate control systems are being integrated into new luxury developments. These features can increase property values by 5-10%.</p>
        `,
        image: "/images/property-5.png",
        category: "lifestyle",
        author: {
            name: "Brian Otieno",
            avatar: "/images/property-3.png",
            role: "Technology Correspondent",
        },
        publishedAt: "2026-07-28T11:00:00Z",
        readTime: 5,
        tags: ["Smart Home", "Technology", "Solar", "Security"],
    },
    {
        id: "6",
        slug: "rental-income-maximization-strategies",
        title: "7 Strategies to Maximize Your Rental Income in Kenya",
        excerpt: "Owning rental property is just the beginning. Learn proven strategies to boost your yields, reduce vacancies, and build long-term wealth.",
        content: `
            <p>Kenya's rental market offers attractive returns, but maximizing your income requires more than just buying a property and waiting for tenants. Here are seven proven strategies.</p>
            
            <h2>1. Furnish Strategically</h2>
            <p>Furnished apartments in Nairobi command 30-50% higher rents. Focus on quality, durable furniture and invest in a good mattress and quality kitchen equipment.</p>
            
            <h2>2. Target the Right Market</h2>
            <p>Identify your ideal tenant — young professionals, families, or corporate clients — and tailor your property accordingly. Corporate lets offer the best returns but require higher upfront investment.</p>
            
            <h2>3. Invest in Professional Photography</h2>
            <p>Properties with professional photos receive 3x more inquiries. Budget KES 10,000-20,000 for a professional shoot — it pays for itself within a month.</p>
            
            <h2>4. Maintain Proactively</h2>
            <p>Address maintenance issues immediately. Happy tenants stay longer, reducing the costly vacancy periods between tenancies.</p>
            
            <h2>5. Explore Short-Term Rentals</h2>
            <p>Airbnb properties in prime locations can earn 2-3x more than long-term lets. However, they require more active management.</p>
            
            <h2>6. Add Value-Added Amenities</h2>
            <p>Fast internet, backup power, and parking can justify premium rents. A good Wi-Fi setup costs KES 5,000/month but adds KES 15,000-20,000 to monthly rent.</p>
            
            <h2>7. Work with a Property Manager</h2>
            <p>Professional management (typically 10% of rent) frees your time and often results in better tenant selection and rent collection.</p>
        `,
        image: "/images/property-6.png",
        category: "investment",
        author: {
            name: "James Mwangi",
            avatar: "/images/property-1.png",
            role: "Senior Market Analyst",
        },
        publishedAt: "2026-07-22T09:00:00Z",
        readTime: 9,
        tags: ["Rental Income", "Investment", "Tips", "Landlord"],
    },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
    return blogPosts.find((p) => p.slug === slug);
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
