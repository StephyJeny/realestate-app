import type { Metadata } from "next";
import { getUserProfile } from "@/lib/firestore";
import { SITE_URL, absoluteUrl } from "@/lib/site";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const url = `${SITE_URL}/agents/${id}`;

    try {
        const agent = await getUserProfile(id);
        // Only approved agents are public; anything else gets a generic, non-indexed page
        if (agent && agent.role === "agent" && agent.agentStatus === "approved") {
            const name = agent.displayName || "EstateVue Agent";
            const where = agent.location ? ` in ${agent.location}` : " in Kenya";
            const title = `${name} — Real Estate Agent${where} | EstateVue`;
            const ratingText = agent.totalReviews ? ` Rated ${agent.rating?.toFixed(1)}/5 from ${agent.totalReviews} reviews.` : "";
            const description = `${name}${agent.agency ? ` of ${agent.agency}` : ""}, ${agent.specialization || "property"} specialist${where}.${ratingText} View listings and contact ${name.split(" ")[0]} on EstateVue.`;
            const image = absoluteUrl(agent.avatar || "/images/agent-avatar.png");

            return {
                title,
                description,
                alternates: { canonical: url },
                openGraph: {
                    title,
                    description,
                    url,
                    siteName: "EstateVue",
                    type: "profile",
                    images: [{ url: image, alt: name }],
                    locale: "en_KE",
                },
                twitter: { card: "summary", title, description, images: [image] },
            };
        }
    } catch (e) {
        console.warn("Failed to fetch agent metadata:", e);
    }

    return {
        title: "Real Estate Agent Profile — EstateVue",
        description: "Connect with verified real estate agents across Kenya on EstateVue.",
        alternates: { canonical: url },
    };
}

export default function AgentProfileLayout({ children }: { children: React.ReactNode }) {
    return children;
}
