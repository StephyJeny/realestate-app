import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About EstateVue — Premium Real Estate Platform",
    description: "Learn about EstateVue, Kenya's leading real estate platform. Our mission is to connect buyers with their dream properties through technology and trusted agents.",
    keywords: "about EstateVue, real estate platform Kenya, property marketplace, about us",
    openGraph: {
        title: "About EstateVue — Premium Real Estate Platform",
        description: "Learn about Kenya's leading real estate platform.",
        siteName: "EstateVue",
        type: "website",
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
