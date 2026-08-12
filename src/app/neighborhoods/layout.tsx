import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Neighborhood Guides — EstateVue",
    description: "Explore in-depth neighborhood profiles across Kenya. Safety scores, walkability, transit access, local amenities, schools, hospitals, and property insights for Nairobi, Mombasa, and more.",
    keywords: "Kenya neighborhoods, Nairobi neighborhoods, Mombasa areas, neighborhood guide, safety scores, walkability, schools, hospitals",
    openGraph: {
        title: "Neighborhood Guides — EstateVue",
        description: "In-depth neighborhood profiles with safety scores, amenities, and property insights across Kenya.",
        siteName: "EstateVue",
        type: "website",
        locale: "en_KE",
    },
    twitter: {
        card: "summary",
        title: "Neighborhood Guides — EstateVue",
        description: "Explore Kenya's best neighborhoods with detailed guides.",
    },
};

export default function NeighborhoodsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
