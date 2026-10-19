"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
    getUserProfile,
    UserProfile,
    getPropertiesByAgent,
    FirestoreProperty,
    getReviewsByAgent,
    submitReview,
    deleteReview,
    sendInquiry,
    Review,
} from "@/lib/firestore";
import { getOrCreateConversation } from "@/lib/chat";
import { sendInquiryEmail } from "@/lib/email";
import styles from "./page.module.css";

// Sample agents for demo profiles
const sampleAgents: Record<string, {
    id: string; name: string; role: string; image: string; phone: string; email: string;
    bio: string; specialization: string[]; areas: string[]; experience: number;
    propertiesSold: number; rating: number; reviews: number; languages: string[];
    agency: string;
}> = {
    "sample-1": {
        id: "sample-1", name: "Sarah Kimani", role: "Senior Real Estate Agent",
        image: "/images/agent-avatar.png", phone: "+254 712 345 678", email: "sarah@estatevue.com",
        bio: "With over 8 years of experience in Kenya's luxury real estate market, Sarah has helped hundreds of families find their dream homes. She is known for her meticulous attention to detail and deep understanding of market trends in Nairobi's premium neighborhoods.",
        specialization: ["Luxury Villas", "Penthouses", "Waterfront Properties"],
        areas: ["Karen", "Runda", "Muthaiga"], experience: 8, propertiesSold: 245,
        rating: 4.9, reviews: 127, languages: ["English", "Swahili"], agency: "EstateVue Premier",
    },
    "sample-2": {
        id: "sample-2", name: "James Ochieng", role: "Commercial Property Specialist",
        image: "/images/agent-1.png", phone: "+254 723 456 789", email: "james@estatevue.com",
        bio: "James brings a decade of expertise in commercial real estate. From office spaces to retail properties, he understands what businesses need to thrive. His analytical approach and negotiation skills have earned him recognition across the industry.",
        specialization: ["Commercial", "Office Spaces", "Retail Properties"],
        areas: ["Westlands", "Upper Hill", "CBD"], experience: 10, propertiesSold: 180,
        rating: 4.8, reviews: 98, languages: ["English", "Swahili", "Luo"], agency: "EstateVue Commercial",
    },
    "sample-3": {
        id: "sample-3", name: "Grace Wanjiku", role: "Residential Sales Expert",
        image: "/images/agent-2.png", phone: "+254 734 567 890", email: "grace@estatevue.com",
        bio: "Grace is passionate about connecting families with their perfect homes. Her warm personality and exceptional market knowledge make her a top choice for first-time buyers. She has a talent for understanding her clients' needs and finding properties that match their vision.",
        specialization: ["Family Homes", "Apartments", "Townhouses"],
        areas: ["Kilimani", "Lavington", "Kileleshwa"], experience: 6, propertiesSold: 156,
        rating: 4.9, reviews: 112, languages: ["English", "Swahili", "Kikuyu"], agency: "EstateVue Residential",
    },
};

const sampleFallbackReviews: Record<string, Review[]> = {
    "sample-1": [
        {
            id: "demo-rev-1",
            agentId: "sample-1",
            agentName: "Sarah Kimani",
            reviewerId: "demo-buyer-1",
            reviewerName: "Dr. Peter Njoroge",
            reviewerAvatar: "",
            rating: 5,
            title: "Seamless purchase in Karen",
            comment: "Sarah handled our Karen villa acquisition from initial viewing through Ardhisasa title verification and closing. Highly transparent and responsive.",
            isVerifiedPurchase: true,
            helpfulCount: 6,
        },
        {
            id: "demo-rev-2",
            agentId: "sample-1",
            agentName: "Sarah Kimani",
            reviewerId: "demo-buyer-2",
            reviewerName: "Amina Abdi",
            reviewerAvatar: "",
            rating: 5,
            title: "Deep market insight in Runda",
            comment: "Negotiated an excellent price and connected us with a reliable conveyancing advocate. Best luxury agent we have worked with in Nairobi.",
            isVerifiedPurchase: true,
            helpfulCount: 4,
        },
    ],
    "sample-2": [
        {
            id: "demo-rev-3",
            agentId: "sample-2",
            agentName: "James Ochieng",
            reviewerId: "demo-buyer-3",
            reviewerName: "Martin Kariuki",
            reviewerAvatar: "",
            rating: 5,
            title: "Grade-A office lease in Westlands",
            comment: "James structured our 5-year commercial lease in Westlands with favorable fit-out terms and parking allocation.",
            isVerifiedPurchase: true,
            helpfulCount: 5,
        },
    ],
    "sample-3": [
        {
            id: "demo-rev-4",
            agentId: "sample-3",
            agentName: "Grace Wanjiku",
            reviewerId: "demo-buyer-4",
            reviewerName: "Faith Mutua",
            reviewerAvatar: "",
            rating: 5,
            title: "Found our Kilimani family apartment",
            comment: "Grace listened carefully to our school commute and budget requirements and found us a 3-bedroom apartment in Kilimani within a week.",
            isVerifiedPurchase: true,
            helpfulCount: 7,
        },
    ],
};

function StarIcons({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <>
            {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} width={size} height={size} viewBox="0 0 24 24"
                    fill={star <= Math.round(rating) ? "currentColor" : "none"}
                    stroke="currentColor" strokeWidth="2"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </>
    );
}

export default function AgentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const agentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [agent, setAgent] = useState<UserProfile | null>(null);
    const [sampleAgent, setSampleAgent] = useState<typeof sampleAgents["sample-1"] | null>(null);
    const [properties, setProperties] = useState<FirestoreProperty[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    // Review form state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState("");
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    // Inquiry form state
    const [showInquiryForm, setShowInquiryForm] = useState(false);
    const [inquiryName, setInquiryName] = useState("");
    const [inquiryEmail, setInquiryEmail] = useState("");
    const [inquiryPhone, setInquiryPhone] = useState("");
    const [inquiryMessage, setInquiryMessage] = useState("Hi, I would like to discuss buying/selling a property with you.");
    const [sendingInquiry, setSendingInquiry] = useState(false);

    const handleToggleInquiryForm = () => {
        if (!showInquiryForm && (userProfile || user)) {
            setInquiryName((prev) => prev || userProfile?.displayName || "");
            setInquiryEmail((prev) => prev || userProfile?.email || user?.email || "");
            setInquiryPhone((prev) => prev || userProfile?.phone || "");
        }
        setShowInquiryForm((prev) => !prev);
    };

    const loadProfileData = useCallback(async () => {
        try {
            if (sampleAgents[agentId]) {
                const firestoreRevs = await getReviewsByAgent(agentId).catch(() => []);
                setSampleAgent(sampleAgents[agentId]);
                setReviews([...firestoreRevs, ...(sampleFallbackReviews[agentId] || [])]);
                setLoading(false);
                return;
            }

            const profile = await getUserProfile(agentId);
            if (profile && profile.role === "agent") {
                const [props, revs] = await Promise.all([
                    getPropertiesByAgent(agentId),
                    getReviewsByAgent(agentId),
                ]);
                setAgent(profile);
                setProperties(props.filter((p) => p.status === "active" || p.status === "under_offer" || p.status === "price_reduced"));
                setReviews(revs);
            }
        } catch (err) {
            console.error("Failed to load agent profile:", err);
        } finally {
            setLoading(false);
        }
    }, [agentId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadProfileData();
        }, 0);
        return () => clearTimeout(timer);
    }, [loadProfileData]);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingPage}>
                    <div className={styles.spinner} />
                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.88rem" }}>Loading agent profile...</span>
                </div>
            </div>
        );
    }

    // Build a unified view model
    const isReal = !!agent;
    const name = agent?.displayName || sampleAgent?.name || "Agent";
    const role = agent?.specialization || sampleAgent?.role || "Real Estate Agent";
    const image = agent?.avatar || sampleAgent?.image || "/images/agent-avatar.png";
    const phone = agent?.phone || sampleAgent?.phone || "";
    const email = agent?.email || sampleAgent?.email || "";
    const bio = agent?.bio || sampleAgent?.bio || "";
    const agency = agent?.agency || sampleAgent?.agency || "";
    const experience = agent?.experience ? parseInt(agent.experience) || 0 : sampleAgent?.experience || 0;
    const location = agent?.location || sampleAgent?.areas?.join(", ") || "";
    const specialization = agent?.specialization ? [agent.specialization] : sampleAgent?.specialization || [];
    const areas = agent?.location ? [agent.location] : sampleAgent?.areas || [];
    const languages = sampleAgent?.languages || ["English", "Swahili"];
    const rating = agent?.rating || sampleAgent?.rating || (reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0);
    const totalReviews = agent?.totalReviews || (sampleAgent ? sampleAgent.reviews : reviews.length);
    const propertiesCount = isReal ? properties.length : sampleAgent?.propertiesSold || 0;

    if (!agent && !sampleAgent) {
        return (
            <div className={styles.page}>
                <div className={styles.notFound}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" /><path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
                    </svg>
                    <h2>Agent Not Found</h2>
                    <p>The agent profile you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <Link href="/agents" className={styles.notFoundLink}>
                        ← Back to All Agents
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (timestamp: { seconds: number } | undefined) => {
        if (!timestamp) return "Verified Client";
        return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
        });
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) {
            toast.error("Please sign in to leave a review");
            router.push("/auth/signin");
            return;
        }
        if (user.uid === agentId) {
            toast.error("You cannot review your own profile");
            return;
        }
        if (!reviewComment.trim()) {
            toast.error("Please enter your review comment");
            return;
        }

        setSubmittingReview(true);
        try {
            if (isReal) {
                await submitReview({
                    agentId,
                    agentName: name,
                    reviewerId: user.uid,
                    reviewerName: userProfile.displayName || "Verified Buyer",
                    reviewerAvatar: userProfile.avatar || "",
                    rating: reviewRating,
                    title: reviewTitle.trim(),
                    comment: reviewComment.trim(),
                    isVerifiedPurchase: false,
                });
                await loadProfileData();
            } else {
                const newRev: Review = {
                    id: `${user.uid}_${agentId}`,
                    agentId,
                    agentName: name,
                    reviewerId: user.uid,
                    reviewerName: userProfile.displayName || "Verified Buyer",
                    reviewerAvatar: userProfile.avatar || "",
                    rating: reviewRating,
                    title: reviewTitle.trim(),
                    comment: reviewComment.trim(),
                    isVerifiedPurchase: false,
                    helpfulCount: 0,
                };
                setReviews((prev) => [newRev, ...prev.filter((r) => r.reviewerId !== user.uid)]);
            }
            toast.success("Review published! Thank you ⭐");
            setShowReviewForm(false);
            setReviewTitle("");
            setReviewComment("");
            setReviewRating(5);
        } catch (err: unknown) {
            if (err instanceof Error && err.message === "already_reviewed") {
                toast.error("You have already reviewed this agent");
            } else {
                console.error("Failed to submit review:", err);
                toast.error("Failed to submit review. Please try again.");
            }
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (revId?: string) => {
        if (!revId || !user) return;
        try {
            if (isReal) {
                await deleteReview(revId, agentId);
                await loadProfileData();
            } else {
                setReviews((prev) => prev.filter((r) => r.id !== revId));
            }
            toast.success("Your review was removed");
        } catch (err) {
            console.error("Failed to delete review:", err);
            toast.error("Could not delete review");
        }
    };

    const handleSendAgentInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryMessage.trim()) {
            toast.error("Please fill in your name, email, and message");
            return;
        }
        setSendingInquiry(true);
        try {
            await sendInquiry({
                propertyId: properties[0]?.id || "agent-profile-inquiry",
                propertyTitle: properties[0]?.title || `Direct Agent Consultation (${name})`,
                senderId: user?.uid || "guest",
                senderName: inquiryName.trim(),
                senderEmail: inquiryEmail.trim(),
                senderPhone: inquiryPhone.trim(),
                agentId,
                agentName: name,
                message: inquiryMessage.trim(),
                type: "inquiry",
            });

            if (email) {
                await sendInquiryEmail({
                    propertyId: properties[0]?.id,
                    agentName: name,
                    agentEmail: email,
                    senderName: inquiryName.trim(),
                    senderEmail: inquiryEmail.trim(),
                    senderPhone: inquiryPhone.trim(),
                    propertyTitle: `Agent Consultation Request for ${name}`,
                    message: inquiryMessage.trim(),
                    inquiryType: "inquiry",
                });
            }

            toast.success(`Message sent to ${name.split(" ")[0]}! ✉️`);
            setShowInquiryForm(false);
        } catch (err) {
            console.error("Failed to send inquiry to agent:", err);
            toast.error("Failed to send inquiry. Please try again.");
        } finally {
            setSendingInquiry(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <Link href="/agents" className={styles.backLink}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to All Agents
                    </Link>

                    <div className={styles.heroGrid}>
                        <div className={styles.avatarWrap}>
                            <Image
                                src={image}
                                alt={name}
                                width={180}
                                height={180}
                                className={styles.avatar}
                            />
                            {isReal && (
                                <div className={styles.verifiedBadge}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    VERIFIED
                                </div>
                            )}
                        </div>

                        <div className={styles.heroInfo}>
                            <h1 className={styles.heroName}>{name}</h1>
                            <p className={styles.heroRole}>{role}</p>
                            {agency && (
                                <p className={styles.heroAgency}>
                                    <strong>{agency}</strong>
                                </p>
                            )}
                            <p className={styles.heroBio}>{bio}</p>

                            <div className={styles.heroStats}>
                                <div className={styles.heroStat}>
                                    <span className={styles.heroStatValue}>{experience || "New"}</span>
                                    <span className={styles.heroStatLabel}>Yrs Exp</span>
                                </div>
                                <div className={styles.heroStat}>
                                    <span className={styles.heroStatValue}>{propertiesCount}</span>
                                    <span className={styles.heroStatLabel}>{isReal ? "Listings" : "Sold"}</span>
                                </div>
                                <div className={styles.heroStat}>
                                    <span className={styles.heroStatValue}>
                                        {rating > 0 ? rating.toFixed(1) : "—"}
                                    </span>
                                    <span className={styles.heroStatLabel}>Rating</span>
                                </div>
                                <div className={styles.heroStat}>
                                    <span className={styles.heroStatValue}>{totalReviews}</span>
                                    <span className={styles.heroStatLabel}>Reviews</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <div className={styles.content}>
                {/* Main Column */}
                <div className={styles.mainCol}>
                    {/* Details */}
                    <div className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="8" r="4" /><path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
                            </svg>
                            Agent Details
                        </h2>
                        <div className={styles.detailsGrid}>
                            {location && (
                                <div className={styles.detailItem}>
                                    <div className={styles.detailIcon}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className={styles.detailLabel}>Location</div>
                                        <div className={styles.detailValue}>{location}</div>
                                    </div>
                                </div>
                            )}
                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3h-8v4h8V3z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className={styles.detailLabel}>Experience</div>
                                    <div className={styles.detailValue}>{experience ? `${experience} years` : "New Agent"}</div>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className={styles.detailLabel}>Rating</div>
                                    <div className={styles.detailValue}>{rating > 0 ? `${rating.toFixed(1)} / 5.0` : "No ratings yet"}</div>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                                    </svg>
                                </div>
                                <div>
                                    <div className={styles.detailLabel}>Languages</div>
                                    <div className={styles.detailValue}>{languages.join(", ")}</div>
                                </div>
                            </div>
                        </div>

                        {/* Specializations */}
                        {specialization.length > 0 && (
                            <div style={{ marginTop: "var(--space-lg)" }}>
                                <div className={styles.detailLabel} style={{ marginBottom: "0.5rem" }}>Specializations</div>
                                <div className={styles.tagList}>
                                    {specialization.map((s) => (
                                        <span key={s} className={styles.tag}>{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Areas served */}
                        {areas.length > 0 && (
                            <div style={{ marginTop: "var(--space-md)" }}>
                                <div className={styles.detailLabel} style={{ marginBottom: "0.5rem" }}>Areas Served</div>
                                <div className={styles.tagList}>
                                    {areas.map((a) => (
                                        <span key={a} className={styles.tag}>{a}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Properties */}
                    {isReal && properties.length > 0 && (
                        <div className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Active Listings ({properties.length})
                            </h2>
                            <div className={styles.propertyGrid}>
                                {properties.slice(0, 6).map((prop) => (
                                    <Link key={prop.id} href={`/properties/${prop.id}`} className={styles.propertyMini}>
                                        {prop.images?.[0] ? (
                                            <Image
                                                src={prop.images[0]}
                                                alt={prop.title}
                                                width={80}
                                                height={72}
                                                className={styles.propertyThumb}
                                            />
                                        ) : (
                                            <div className={styles.propertyThumb} style={{ background: "var(--gray-200)" }} />
                                        )}
                                        <div className={styles.propertyInfo}>
                                            <div className={styles.propertyTitle}>{prop.title}</div>
                                            <div className={styles.propertyPrice}>
                                                KES {prop.price?.toLocaleString()}
                                            </div>
                                            <div className={styles.propertyMeta}>
                                                {prop.bedrooms} bed · {prop.bathrooms} bath · {prop.area?.toLocaleString()} sqft
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {properties.length > 6 && (
                                <Link href={`/properties?agentId=${agentId}`} className={styles.viewAllBtn}>
                                    View All {properties.length} Listings
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Reviews */}
                    <div className={styles.sectionCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                Reviews & Ratings
                            </h2>
                            {user?.uid !== agentId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!user) {
                                            toast.error("Please sign in to leave a review");
                                            router.push("/auth/signin");
                                            return;
                                        }
                                        setShowReviewForm((prev) => !prev);
                                    }}
                                    style={{
                                        padding: "0.45rem 1rem",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid var(--gold-500)",
                                        background: showReviewForm ? "transparent" : "linear-gradient(135deg, var(--gold-500), #e8b930)",
                                        color: showReviewForm ? "var(--gold-600)" : "#0a0e1a",
                                        fontWeight: 700,
                                        fontSize: "0.82rem",
                                        cursor: "pointer",
                                    }}
                                >
                                    {showReviewForm ? "Cancel" : "✍️ Write a Review"}
                                </button>
                            )}
                        </div>

                        {showReviewForm && (
                            <form
                                onSubmit={handleReviewSubmit}
                                style={{
                                    padding: "1.25rem",
                                    marginBottom: "1.25rem",
                                    background: "var(--bg-secondary, #f8fafc)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border-color, #e2e8f0)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.85rem",
                                }}
                            >
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "var(--text-secondary)" }}>
                                        Your Rating *
                                    </label>
                                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewRating(star)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: star <= reviewRating ? "var(--gold-500, #d4a017)" : "var(--gray-300, #cbd5e1)",
                                                    padding: "2px",
                                                }}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            </button>
                                        ))}
                                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gold-600)", marginLeft: "0.35rem" }}>
                                            {reviewRating} / 5
                                        </span>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Review headline (e.g., Smooth buying process in Karen)"
                                    value={reviewTitle}
                                    onChange={(e) => setReviewTitle(e.target.value)}
                                    style={{
                                        padding: "0.65rem 0.85rem",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--border-color, #cbd5e1)",
                                        background: "var(--bg-primary, #fff)",
                                        fontSize: "0.88rem",
                                    }}
                                />

                                <textarea
                                    rows={3}
                                    placeholder="Share your experience working with this agent..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    required
                                    style={{
                                        padding: "0.65rem 0.85rem",
                                        borderRadius: "var(--radius-sm)",
                                        border: "1px solid var(--border-color, #cbd5e1)",
                                        background: "var(--bg-primary, #fff)",
                                        fontSize: "0.88rem",
                                        resize: "vertical",
                                    }}
                                />

                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="btn btn-primary"
                                    style={{ alignSelf: "flex-start", padding: "0.55rem 1.25rem", fontSize: "0.85rem" }}
                                >
                                    {submittingReview ? "Publishing..." : "Publish Review"}
                                </button>
                            </form>
                        )}

                        {reviews.length > 0 ? (
                            <>
                                <div className={styles.reviewStats}>
                                    <div className={styles.ratingBig}>
                                        <div className={styles.ratingNumber}>{rating > 0 ? rating.toFixed(1) : "—"}</div>
                                        <div className={styles.ratingStars}>
                                            <StarIcons rating={rating} size={16} />
                                        </div>
                                        <div className={styles.ratingCount}>{totalReviews} review{totalReviews !== 1 ? "s" : ""}</div>
                                    </div>
                                </div>
                                <div className={styles.reviewList}>
                                    {reviews.slice(0, 8).map((rev) => (
                                        <div key={rev.id} className={styles.reviewCard}>
                                            <div className={styles.reviewHeader} style={{ justifyContent: "space-between" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                                    <Image
                                                        src={rev.reviewerAvatar || "/images/agent-avatar.png"}
                                                        alt={rev.reviewerName}
                                                        width={36}
                                                        height={36}
                                                        className={styles.reviewAvatar}
                                                    />
                                                    <div>
                                                        <div className={styles.reviewerName}>{rev.reviewerName}</div>
                                                        <div className={styles.reviewDate}>
                                                            {formatDate(rev.createdAt as { seconds: number } | undefined)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {user && rev.reviewerId === user.uid && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReview(rev.id)}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "var(--error, #ef4444)",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                            <div className={styles.reviewStars}>
                                                <StarIcons rating={rev.rating} />
                                            </div>
                                            {rev.title && <div className={styles.reviewTitle}>{rev.title}</div>}
                                            <p className={styles.reviewComment}>{rev.comment}</p>
                                            {rev.agentResponse && (
                                                <div className={styles.agentResponseBox}>
                                                    <div className={styles.agentResponseLabel}>Agent Response</div>
                                                    <p className={styles.agentResponseText}>{rev.agentResponse}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyReviews}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <p>No reviews yet for this agent. Be the first to leave one!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarCard}>
                        <h3 className={styles.contactTitle}>Contact {name.split(" ")[0]}</h3>
                        <div className={styles.contactList}>
                            {phone && (
                                <a href={`tel:${phone}`} className={styles.contactItem}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    {phone}
                                </a>
                            )}
                            {email && (
                                <a href={`mailto:${email}`} className={styles.contactItem}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    {email}
                                </a>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleInquiryForm}
                            className={styles.contactBtnPrimary}
                            style={{ width: "100%", border: "none", cursor: "pointer" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            {showInquiryForm ? "Close Inquiry Form" : "Send Direct Inquiry"}
                        </button>

                        {showInquiryForm && (
                            <form
                                onSubmit={handleSendAgentInquiry}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.6rem",
                                    marginTop: "0.75rem",
                                    marginBottom: "0.75rem",
                                    padding: "0.85rem",
                                    background: "var(--bg-secondary, #f8fafc)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border-color, #e2e8f0)",
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Your Name *"
                                    value={inquiryName}
                                    onChange={(e) => setInquiryName(e.target.value)}
                                    required
                                    style={{ padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.84rem" }}
                                />
                                <input
                                    type="email"
                                    placeholder="Your Email *"
                                    value={inquiryEmail}
                                    onChange={(e) => setInquiryEmail(e.target.value)}
                                    required
                                    style={{ padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.84rem" }}
                                />
                                <input
                                    type="tel"
                                    placeholder="Your Phone"
                                    value={inquiryPhone}
                                    onChange={(e) => setInquiryPhone(e.target.value)}
                                    style={{ padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.84rem" }}
                                />
                                <textarea
                                    rows={3}
                                    placeholder="How can this agent help you?"
                                    value={inquiryMessage}
                                    onChange={(e) => setInquiryMessage(e.target.value)}
                                    required
                                    style={{ padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.84rem", resize: "vertical" }}
                                />
                                <button
                                    type="submit"
                                    disabled={sendingInquiry}
                                    className="btn btn-primary"
                                    style={{ width: "100%", padding: "0.55rem", fontSize: "0.84rem" }}
                                >
                                    {sendingInquiry ? "Sending..." : "Submit Inquiry"}
                                </button>
                            </form>
                        )}

                        {isReal && user?.uid !== agentId && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!user || !userProfile) {
                                        toast.error("Please sign in to chat with this agent");
                                        router.push("/auth/signin");
                                        return;
                                    }
                                    try {
                                        const convoId = await getOrCreateConversation({
                                            currentUserId: user.uid,
                                            currentUserName: userProfile.displayName || "Buyer",
                                            currentUserAvatar: userProfile.avatar || "",
                                            otherUserId: agentId,
                                            otherUserName: name,
                                            otherUserAvatar: image,
                                        });
                                        router.push(`/messages?c=${convoId}`);
                                    } catch (err) {
                                        console.error("Failed to start chat:", err);
                                        toast.error("Could not start chat");
                                    }
                                }}
                                style={{
                                    width: "100%",
                                    marginTop: "0.5rem",
                                    padding: "0.65rem 1rem",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid rgba(212,160,23,0.35)",
                                    background: "var(--navy-800, #0f1629)",
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: "0.88rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                💬 Chat Live in App
                            </button>
                        )}

                        {phone && (
                            <a
                                href={`https://wa.me/${phone.replace(/\s+/g, "").replace("+", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappBtn}
                                style={{ marginTop: "0.5rem" }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                WhatsApp
                            </a>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
