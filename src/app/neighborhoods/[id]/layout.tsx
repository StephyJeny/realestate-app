import type { Metadata } from "next";
import { getNeighborhoodById } from "@/lib/neighborhoods";

const BASE_URL = "https://realestate-app-three-theta.vercel.app";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const neighborhood = getNeighborhoodById(id);

    if (!neighborhood) {
        return {
            title: "Neighborhood Not Found — EstateVue",
            description: "The neighborhood guide you're looking for could not be found.",
        };
    }

    const n = neighborhood;
    const title = `${n.name}, ${n.city} — Neighborhood Guide | EstateVue`;
    const description = `${n.tagline}. Explore ${n.name} in ${n.city}: safety score ${n.safetyRating}/10, ${n.propertyCount} listings, avg. price ${n.avgPrice}. ${n.description.slice(0, 120)}...`;
    const image = n.image.startsWith("http") ? n.image : `${BASE_URL}${n.image}`;
    const url = `${BASE_URL}/neighborhoods/${id}`;

    return {
        title,
        description,
        keywords: `${n.name}, ${n.city}, Kenya, neighborhood guide, real estate, ${n.vibes.join(", ")}`,
        openGraph: {
            title,
            description: description.slice(0, 200),
            url,
            siteName: "EstateVue",
            type: "article",
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: `${n.name} neighborhood in ${n.city}`,
                },
            ],
            locale: "en_KE",
        },
        twitter: {
            card: "summary_large_image",
            title: `${n.name} — Neighborhood Guide`,
            description: n.tagline,
            images: [image],
        },
        alternates: {
            canonical: url,
        },
    };
}

export default function NeighborhoodDetailLayout({ children }: { children: React.ReactNode }) {
    return children;
}
