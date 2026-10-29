import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { getOffPlanProjectBySlug } from "@/lib/projects";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const project = getOffPlanProjectBySlug(slug);

    if (!project) {
        return {
            title: "Off-Plan Project Not Found — EstateVue",
            description: "The off-plan development you are looking for could not be found.",
        };
    }

    const title = `${project.name} (${project.neighborhood}, ${project.city}) — Off-Plan Tracker | EstateVue`;
    const description = `${project.tagline}. ${project.overallProgressPct}% construction complete, handover ${project.completionQuarter}, protected via ${project.developer.escrowBank}.`;
    const image = project.heroImage.startsWith("http") ? project.heroImage : `${SITE_URL}${project.heroImage}`;
    const url = `${SITE_URL}/projects/${project.slug}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: "EstateVue",
            type: "article",
            images: [{ url: image, width: 1200, height: 630, alt: project.name }],
            locale: "en_KE",
        },
        alternates: { canonical: url },
    };
}

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
    return children;
}
