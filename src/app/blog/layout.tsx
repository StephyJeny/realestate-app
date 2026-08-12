import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog & Market Insights — EstateVue",
    description: "Expert real estate analysis, investment tips, neighborhood guides, and market trends for Kenya's property market. Stay informed with EstateVue's curated content.",
    keywords: "Kenya real estate blog, property market trends, investment tips, neighborhood guides, buying guide, Nairobi property",
    openGraph: {
        title: "Blog & Market Insights — EstateVue",
        description: "Expert analysis, investment tips, and neighborhood guides for Kenya's property market.",
        siteName: "EstateVue",
        type: "website",
        locale: "en_KE",
    },
    twitter: {
        card: "summary",
        title: "Blog & Market Insights — EstateVue",
        description: "Expert real estate insights for Kenya's property market.",
    },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return children;
}
