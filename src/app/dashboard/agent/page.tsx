"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    getPropertiesByAgent,
    addProperty,
    deleteProperty,
    updateProperty,
    getInquiriesByAgent,
    getUserNotifications,
    updateUserProfile,
    replyToInquiry,
    updateInquiryStatus,
    FirestoreProperty,
    Notification,
    Inquiry,
    getReviewsByAgent,
    respondToReview,
    Review,
} from "@/lib/firestore";
import { uploadPropertyImages } from "@/lib/storage";
import toast from "react-hot-toast";
import styles from "../dashboard.module.css";
import AgentGate from "@/components/agent/AgentGate";

export default function AgentDashboard() {
    const router = useRouter();
    const { user, userProfile, loading, logout, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [properties, setProperties] = useState<FirestoreProperty[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [agentReviews, setAgentReviews] = useState<Review[]>([]);
    const [respondingReview, setRespondingReview] = useState<string | null>(null);
    const [responseText, setResponseText] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    // Image upload state
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit property state
    const [editingProperty, setEditingProperty] = useState<FirestoreProperty | null>(null);
    const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
    const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Reply to inquiry state
    const [replyingInquiry, setReplyingInquiry] = useState<Inquiry | null>(null);
    const [replyText, setReplyText] = useState("");

    const [newProperty, setNewProperty] = useState({
        title: "", description: "", type: "apartment" as FirestoreProperty["type"],
        listingType: "sale" as FirestoreProperty["listingType"], price: 0, currency: "KES",
        bedrooms: 0, bathrooms: 0, area: 0, yearBuilt: 2024, address: "",
        city: "", neighborhood: "", amenities: "", latitude: 0, longitude: 0,
        virtualTourUrl: "",
    });

    const [editProfile, setEditProfile] = useState({
        displayName: "", phone: "", bio: "", agency: "", location: "", specialization: "", avatar: "",
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && userProfile) {
            loadData();
            setEditProfile({
                displayName: userProfile.displayName || "",
                phone: userProfile.phone || "",
                bio: userProfile.bio || "",
                agency: userProfile.agency || "",
                location: userProfile.location || "",
                specialization: userProfile.specialization || "",
                avatar: userProfile.avatar || "",
            });
        }
    }, [user, userProfile]);

    const loadData = async () => {
        if (!user) return;
        try {
            const [props, inqs, notifs, reviews] = await Promise.all([
                getPropertiesByAgent(user.uid),
                getInquiriesByAgent(user.uid),
                getUserNotifications(user.uid),
                getReviewsByAgent(user.uid),
            ]);
            setProperties(props);
            setInquiries(inqs);
            setNotifications(notifs);
            setAgentReviews(reviews);
        } catch (err) {
            console.error("Failed to load data:", err);
        }
    };

    const handleRespondToReview = async (reviewId: string) => {
        if (!responseText.trim()) {
            toast.error("Please type a response");
            return;
        }
        try {
            await respondToReview(reviewId, responseText.trim());
            toast.success("Response posted!");
            setRespondingReview(null);
            setResponseText("");
            loadData();
        } catch (err) {
            console.error("Failed to respond:", err);
            toast.error("Failed to post response");
        }
    };

    // Image selection for add modal
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const maxFiles = isEdit ? 6 - existingImages.length : 6;
        const selected = files.slice(0, maxFiles);
        const previews = selected.map((f) => URL.createObjectURL(f));
        if (isEdit) {
            setEditImageFiles((prev) => [...prev, ...selected]);
            setEditImagePreviews((prev) => [...prev, ...previews]);
        } else {
            setImageFiles((prev) => [...prev, ...selected]);
            setImagePreviews((prev) => [...prev, ...previews]);
        }
    };

    const removeImage = (index: number, isEdit = false) => {
        if (isEdit) {
            setEditImageFiles((prev) => prev.filter((_, i) => i !== index));
            setEditImagePreviews((prev) => prev.filter((_, i) => i !== index));
        } else {
            setImageFiles((prev) => prev.filter((_, i) => i !== index));
            setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const handleAddProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) return;
        if (!newProperty.title || !newProperty.price || !newProperty.city) {
            toast.error("Please fill in required fields");
            return;
        }
        if (imageFiles.length === 0) {
            toast.error("Please upload at least one property image");
            return;
        }
        setIsSubmitting(true);
        try {
            // First create property to get ID
            const propData: Record<string, unknown> = {
                ...newProperty,
                amenities: newProperty.amenities.split(",").map((a) => a.trim()).filter(Boolean),
                images: [],
                agentId: user.uid,
                agentName: userProfile.displayName,
                agentEmail: userProfile.email,
                agentPhone: userProfile.phone,
                status: "active",
                isFeatured: false,
                views: 0,
                favorites: 0,
            };
            if (newProperty.virtualTourUrl.trim()) {
                propData.virtualTourUrl = newProperty.virtualTourUrl.trim();
            }
            const propId = await addProperty(propData as Omit<FirestoreProperty, "id" | "createdAt" | "updatedAt">);
            // Upload images
            setUploadProgress(0);
            const urls = await uploadPropertyImages(imageFiles, user.uid, propId, (i, p) => {
                setUploadProgress(Math.round(((i + p / 100) / imageFiles.length) * 100));
            });
            // Update property with image URLs
            await updateProperty(propId, { images: urls });
            toast.success("Property listed successfully! 🏠");
            setShowAddModal(false);
            setNewProperty({
                title: "", description: "", type: "apartment", listingType: "sale",
                price: 0, currency: "KES", bedrooms: 0, bathrooms: 0, area: 0,
                yearBuilt: 2024, address: "", city: "", neighborhood: "", amenities: "",
                latitude: 0, longitude: 0, virtualTourUrl: "",
            });
            setImageFiles([]);
            setImagePreviews([]);
            setUploadProgress(0);
            loadData();
        } catch (err) {
            console.error("Failed to add property:", err);
            toast.error("Failed to add property");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProperty = async (propertyId: string) => {
        if (!user || !confirm("Are you sure you want to delete this property?")) return;
        try {
            await deleteProperty(propertyId, user.uid);
            toast.success("Property deleted");
            loadData();
        } catch (err) {
            console.error("Failed to delete:", err);
            toast.error("Failed to delete property");
        }
    };

    const openEditModal = (prop: FirestoreProperty) => {
        setEditingProperty(prop);
        setExistingImages(prop.images || []);
        setEditImageFiles([]);
        setEditImagePreviews([]);
    };

    const handleEditProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !editingProperty?.id) return;
        setIsSubmitting(true);
        try {
            let updatedImages = [...existingImages];
            if (editImageFiles.length > 0) {
                setUploadProgress(0);
                const newUrls = await uploadPropertyImages(editImageFiles, user.uid, editingProperty.id, (i, p) => {
                    setUploadProgress(Math.round(((i + p / 100) / editImageFiles.length) * 100));
                });
                updatedImages = [...updatedImages, ...newUrls];
            }
            await updateProperty(editingProperty.id, {
                title: editingProperty.title,
                description: editingProperty.description,
                type: editingProperty.type,
                listingType: editingProperty.listingType,
                price: editingProperty.price,
                bedrooms: editingProperty.bedrooms,
                bathrooms: editingProperty.bathrooms,
                area: editingProperty.area,
                address: editingProperty.address,
                city: editingProperty.city,
                neighborhood: editingProperty.neighborhood,
                amenities: editingProperty.amenities,
                images: updatedImages,
                virtualTourUrl: editingProperty.virtualTourUrl || "",
            });
            toast.success("Property updated! ✨");
            setEditingProperty(null);
            setEditImageFiles([]);
            setEditImagePreviews([]);
            setUploadProgress(0);
            loadData();
        } catch (err) {
            console.error("Edit failed:", err);
            toast.error("Failed to update property");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (propId: string, newStatus: FirestoreProperty["status"]) => {
        try {
            await updateProperty(propId, { status: newStatus });
            toast.success(`Property marked as ${newStatus}`);
            loadData();
        } catch (err) {
            console.error("Status change failed:", err);
            toast.error("Failed to update status");
        }
    };

    const handleReplyInquiry = async () => {
        if (!replyingInquiry?.id || !replyText.trim() || !user || !userProfile) return;
        setIsSubmitting(true);
        try {
            await replyToInquiry(replyingInquiry.id, user.uid, userProfile.displayName, replyText.trim());
            toast.success("Reply sent! 💬");
            setReplyingInquiry(null);
            setReplyText("");
            loadData();
        } catch (err) {
            console.error("Reply failed:", err);
            toast.error("Failed to send reply");
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await updateUserProfile(user.uid, editProfile);
            toast.success("Profile updated! ✨");
            await refreshProfile();
            setShowEditProfile(false);
        } catch (err) {
            console.error("Failed to update profile:", err);
            toast.error("Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
        try {
            const { deleteUser: deleteUserDoc } = await import("@/lib/firestore");
            await deleteUserDoc(user!.uid);
            await logout();
            toast.success("Account deleted");
            router.push("/");
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete account");
        }
    };

    if (loading) {
        return (
            <div className={styles.dashboardPage}>
                <div className={styles.loadingWrap}>
                    <div className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    if (!user) return null;

    const isVerified = userProfile?.agentCodeVerified;

    return (
        <AgentGate>
            <div className={styles.dashboardPage}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <span className={`${styles.sidebarRole} ${styles.roleAgent}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                            Agent ✅
                        </span>
                        <span className={styles.sidebarUserName}>{userProfile?.displayName || "Agent"}</span>
                        <span className={styles.sidebarEmail}>{user.email}</span>
                    </div>

                    <nav className={styles.sidebarNav}>
                        <div className={styles.sidebarSection}>
                            <div className={styles.sidebarSectionTitle}>Dashboard</div>
                            <button className={`${styles.sidebarLink} ${activeTab === "overview" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                Overview
                            </button>
                            <button className={`${styles.sidebarLink} ${activeTab === "properties" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("properties"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                My Properties
                                {properties.length > 0 && <span className={styles.sidebarBadge}>{properties.length}</span>}
                            </button>
                            <button className={`${styles.sidebarLink} ${activeTab === "inquiries" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("inquiries"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                Inquiries
                                {inquiries.length > 0 && <span className={styles.sidebarBadge}>{inquiries.length}</span>}
                            </button>
                            <button className={`${styles.sidebarLink} ${activeTab === "notifications" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("notifications"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                Notifications
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className={styles.sidebarBadge}>{notifications.filter(n => !n.read).length}</span>
                                )}
                            </button>
                            <button className={`${styles.sidebarLink} ${activeTab === "reviews" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("reviews"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                Reviews
                                {agentReviews.length > 0 && <span className={styles.sidebarBadge}>{agentReviews.length}</span>}
                            </button>
                        </div>

                        <div className={styles.sidebarSection}>
                            <div className={styles.sidebarSectionTitle}>Account</div>
                            <button className={`${styles.sidebarLink} ${activeTab === "profile" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("profile"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                My Profile
                            </button>
                        </div>
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <button className={styles.logoutBtn} onClick={logout}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitle}>Agent Dashboard</h1>
                        <p className={styles.pageSubtitle}>
                            Manage your properties, respond to inquiries, and grow your business.
                        </p>
                    </div>


                    {activeTab === "overview" && (
                        <>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>🏠</div>
                                        <span className={`${styles.statTrend} ${styles.statTrendUp}`}>Active</span>
                                    </div>
                                    <div className={styles.statValue}>{properties.length}</div>
                                    <div className={styles.statLabel}>Listed Properties</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}>💬</div>
                                    </div>
                                    <div className={styles.statValue}>{inquiries.length}</div>
                                    <div className={styles.statLabel}>Inquiries Received</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconGold}`}>⭐</div>
                                    </div>
                                    <div className={styles.statValue}>{userProfile?.rating || 0}</div>
                                    <div className={styles.statLabel}>Average Rating</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                                            ✅
                                        </div>
                                    </div>
                                    <div className={styles.statValue}>Verified</div>
                                    <div className={styles.statLabel}>Account Status</div>
                                </div>
                            </div>

                            {(
                                <div className={styles.contentCard}>
                                    <div className={styles.contentCardHeader}>
                                        <h3 className={styles.contentCardTitle}>Quick Actions</h3>
                                    </div>
                                    <div className={styles.contentCardBody}>
                                        <div className={styles.quickLinksGrid}>
                                            <button className={styles.quickLink} onClick={() => setShowAddModal(true)}>
                                                <div className={`${styles.quickLinkIcon} ${styles.statIconGreen}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                </div>
                                                Add New Property
                                            </button>
                                            <button className={styles.quickLink} onClick={() => setActiveTab("properties")}>
                                                <div className={`${styles.quickLinkIcon} ${styles.statIconBlue}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                                                </div>
                                                Manage Properties
                                            </button>
                                            <button className={styles.quickLink} onClick={() => setActiveTab("inquiries")}>
                                                <div className={`${styles.quickLinkIcon} ${styles.statIconGold}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                </div>
                                                View Inquiries
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "properties" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>My Properties</h3>
                                {isVerified && (
                                    <button className={styles.contentCardAction} onClick={() => setShowAddModal(true)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Add Property
                                    </button>
                                )}
                            </div>
                            {properties.length > 0 ? (
                                <div className={styles.contentCardBody}>
                                    <div className={styles.propertyGrid}>
                                        {properties.map((prop) => (
                                            <div key={prop.id} className={styles.propertyCard}>
                                                <div className={styles.propertyImageWrap}>
                                                    {prop.images && prop.images.length > 0 && prop.images[0] ? (
                                                        <img src={prop.images[0]} alt={prop.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--navy-300), var(--navy-500))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "2rem" }}>🏠</div>
                                                    )}
                                                    <span className={styles.propertyCardBadge} style={{ background: prop.listingType === "sale" ? "rgba(239,68,68,0.9)" : "rgba(59,130,246,0.9)", color: "#fff" }}>
                                                        {prop.listingType === "sale" ? "For Sale" : "For Rent"}
                                                    </span>
                                                    {prop.status !== "active" && prop.status !== "pending" && (
                                                        <span className={`badge ${prop.status === "sold" ? "badge-sold" :
                                                            prop.status === "rented" ? "badge-rented" :
                                                                prop.status === "under_offer" ? "badge-under-offer" :
                                                                    prop.status === "price_reduced" ? "badge-price-reduced" : ""
                                                            }`} style={{ position: "absolute", top: "8px", right: "8px", fontSize: "0.68rem" }}>
                                                            {prop.status === "sold" && "Sold"}
                                                            {prop.status === "rented" && "Rented"}
                                                            {prop.status === "under_offer" && "Under Offer"}
                                                            {prop.status === "price_reduced" && "Price Reduced"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.propertyCardBody}>
                                                    <h4 className={styles.propertyCardTitle}>{prop.title}</h4>
                                                    <div className={styles.propertyCardLocation}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                        {prop.city}, {prop.neighborhood}
                                                    </div>
                                                    <div className={styles.propertyCardPrice}>
                                                        KES {prop.price.toLocaleString()}{prop.listingType === "rent" ? "/mo" : ""}
                                                    </div>
                                                    <div className={styles.propertyCardMeta}>
                                                        <span>🛏 {prop.bedrooms} Beds</span>
                                                        <span>🚿 {prop.bathrooms} Baths</span>
                                                        <span>📐 {prop.area} sqft</span>
                                                    </div>
                                                    {/* Status Badge */}
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                                                        <span className={`badge ${prop.status === "active" ? "badge-sale" :
                                                            prop.status === "sold" ? "badge-sold" :
                                                                prop.status === "rented" ? "badge-rented" :
                                                                    prop.status === "under_offer" ? "badge-under-offer" :
                                                                        prop.status === "price_reduced" ? "badge-price-reduced" :
                                                                            ""
                                                            }`} style={{ fontSize: "0.72rem" }}>
                                                            {prop.status === "active" && "🟢 Active"}
                                                            {prop.status === "sold" && "🔴 Sold"}
                                                            {prop.status === "rented" && "🟣 Rented"}
                                                            {prop.status === "under_offer" && "🟠 Under Offer"}
                                                            {prop.status === "price_reduced" && "💰 Price Reduced"}
                                                            {prop.status === "pending" && "⏳ Pending"}
                                                        </span>
                                                        {prop.status === "active" && (
                                                            <>
                                                                <button onClick={() => handleStatusChange(prop.id!, "under_offer")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.2)", cursor: "pointer" }}>Under Offer</button>
                                                                <button onClick={() => handleStatusChange(prop.id!, "price_reduced")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)", cursor: "pointer" }}>Price Reduced</button>
                                                                <button onClick={() => handleStatusChange(prop.id!, "sold")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>Mark Sold</button>
                                                                <button onClick={() => handleStatusChange(prop.id!, "rented")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(124,58,237,0.1)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)", cursor: "pointer" }}>Mark Rented</button>
                                                            </>
                                                        )}
                                                        {prop.status === "under_offer" && (
                                                            <>
                                                                <button onClick={() => handleStatusChange(prop.id!, "sold")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>Mark Sold</button>
                                                                <button onClick={() => handleStatusChange(prop.id!, "active")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)", cursor: "pointer" }}>Reactivate</button>
                                                            </>
                                                        )}
                                                        {prop.status === "price_reduced" && (
                                                            <button onClick={() => handleStatusChange(prop.id!, "active")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)", cursor: "pointer" }}>Remove Badge</button>
                                                        )}
                                                        {(prop.status === "sold" || prop.status === "rented") && (
                                                            <button onClick={() => handleStatusChange(prop.id!, "active")} style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)", cursor: "pointer" }}>Reactivate</button>
                                                        )}
                                                    </div>
                                                    <div className={styles.propertyCardActions}>
                                                        <button onClick={() => openEditModal(prop)}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteProperty(prop.id!)}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>🏠</div>
                                    <h3 className={styles.emptyTitle}>No Properties Yet</h3>
                                    <p className={styles.emptyText}>
                                        {isVerified ? "Start listing properties to attract buyers and renters." : "Get verified first to start listing properties."}
                                    </p>
                                    {isVerified && (
                                        <button className={styles.emptyAction} onClick={() => setShowAddModal(true)}>
                                            Add Your First Property
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "inquiries" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>Inquiries Received</h3>
                            </div>
                            {inquiries.length > 0 ? (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>From</th>
                                            <th>Property</th>
                                            <th>Type</th>
                                            <th>Message</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inquiries.map((inq) => (
                                            <tr key={inq.id as string}>
                                                <td>
                                                    <div className={styles.tableUserCell}>
                                                        <div className={styles.tableAvatar}>
                                                            {inq.senderName?.charAt(0) || "U"}
                                                        </div>
                                                        <div className={styles.tableUserInfo}>
                                                            <span className={styles.tableUserName}>{inq.senderName || "User"}</span>
                                                            <span className={styles.tableUserEmail}>{inq.senderEmail || ""}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{inq.propertyTitle || "Property"}</td>
                                                <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>{inq.type || "inquiry"}</span></td>
                                                <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {inq.message || ""}
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${inq.status === "replied" ? styles.statusApproved : inq.status === "closed" ? styles.statusPending : styles.statusActive}`}>
                                                        {inq.status === "replied" ? "✅ Replied" : inq.status === "closed" ? "⬜ Closed" : "🆕 New"}
                                                    </span>
                                                </td>
                                                <td>{inq.createdAt ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
                                                <td>
                                                    <div style={{ display: "flex", gap: "0.35rem" }}>
                                                        {inq.status !== "replied" && (
                                                            <button onClick={() => { setReplyingInquiry(inq); setReplyText(""); }} style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem", borderRadius: "4px", background: "var(--navy-800)", color: "#fff", border: "none", cursor: "pointer" }}>Reply</button>
                                                        )}
                                                        {inq.status !== "closed" && (
                                                            <button onClick={() => updateInquiryStatus(inq.id!, "closed").then(() => { toast.success("Inquiry closed"); loadData(); })} style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem", borderRadius: "4px", background: "rgba(107,114,128,0.1)", color: "var(--gray-600)", border: "1px solid var(--gray-200)", cursor: "pointer" }}>Close</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>💬</div>
                                    <h3 className={styles.emptyTitle}>No Inquiries Yet</h3>
                                    <p className={styles.emptyText}>
                                        Once buyers start reaching out about your properties, their inquiries will appear here.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>Notifications</h3>
                            </div>
                            <div className={styles.contentCardBody}>
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className={`${styles.notificationItem} ${!notif.read ? styles.notificationUnread : ""}`}>
                                            <div className={styles.notificationIcon} style={{
                                                background: notif.type === "agent_approved" ? "rgba(16,185,129,0.1)" : notif.type === "new_inquiry" ? "rgba(59,130,246,0.1)" : "rgba(239,68,68,0.1)",
                                                color: notif.type === "agent_approved" ? "var(--success)" : notif.type === "new_inquiry" ? "var(--primary)" : "var(--error)"
                                            }}>
                                                {notif.type === "agent_approved" ? "🎉" : notif.type === "new_inquiry" ? "📩" : "📋"}
                                            </div>
                                            <div>
                                                <div className={styles.notificationTitle}>{notif.title}</div>
                                                <div className={styles.notificationMsg}>{notif.message}</div>
                                                {notif.agentCode && (
                                                    <div style={{ marginTop: "0.5rem", padding: "0.4rem 0.75rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", letterSpacing: "2px", display: "inline-block" }}>
                                                        {notif.agentCode}
                                                    </div>
                                                )}
                                                <div className={styles.notificationTime}>
                                                    {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : ""}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>
                                        <div className={styles.emptyIcon}>🔔</div>
                                        <h3 className={styles.emptyTitle}>No Notifications</h3>
                                        <p className={styles.emptyText}>You&apos;ll receive notifications here when there are updates about your account.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>My Profile</h3>
                                <button className={styles.contentCardAction} onClick={() => setShowEditProfile(!showEditProfile)}>
                                    {showEditProfile ? "Cancel" : "Edit Profile"}
                                </button>
                            </div>
                            <div className={styles.contentCardBody}>
                                {showEditProfile ? (
                                    <div className={styles.formGrid}>
                                        {/* Profile Photo URL */}
                                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                            <label className={styles.formLabel}>Profile Photo</label>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                <div style={{
                                                    width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
                                                    border: "3px solid var(--gold-500)", flexShrink: 0,
                                                    background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center"
                                                }}>
                                                    {editProfile.avatar ? (
                                                        <img src={editProfile.avatar} alt="Preview" style={{ objectFit: "cover", width: "100%", height: "100%" }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    ) : (
                                                        <span style={{ fontSize: "1.8rem" }}>👤</span>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <input
                                                        className={styles.formInput}
                                                        value={editProfile.avatar}
                                                        onChange={(e) => setEditProfile({ ...editProfile, avatar: e.target.value })}
                                                        placeholder="https://example.com/your-photo.jpg"
                                                    />
                                                    <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "0.3rem" }}>
                                                        📷 Paste a link to your photo (from LinkedIn, Facebook, Google Drive, etc.)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Full Name</label>
                                            <input className={styles.formInput} value={editProfile.displayName}
                                                onChange={(e) => setEditProfile({ ...editProfile, displayName: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Phone</label>
                                            <input className={styles.formInput} value={editProfile.phone}
                                                onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Agency</label>
                                            <input className={styles.formInput} value={editProfile.agency}
                                                onChange={(e) => setEditProfile({ ...editProfile, agency: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Location</label>
                                            <input className={styles.formInput} value={editProfile.location}
                                                onChange={(e) => setEditProfile({ ...editProfile, location: e.target.value })} />
                                        </div>
                                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                            <label className={styles.formLabel}>Bio</label>
                                            <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={editProfile.bio}
                                                onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                                                placeholder="Tell buyers about yourself..." />
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className={styles.formBtnSecondary} onClick={() => setShowEditProfile(false)}>Cancel</button>
                                            <button className={styles.formBtnPrimary} onClick={handleSaveProfile} disabled={isSubmitting}>
                                                {isSubmitting ? "Saving..." : "Save Changes"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Name</strong>{userProfile?.displayName}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Email</strong>{userProfile?.email}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Phone</strong>{userProfile?.phone || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Agency</strong>{userProfile?.agency || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Location</strong>{userProfile?.location || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Specialization</strong>{userProfile?.specialization || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Status</strong>
                                            <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
                                                Verified
                                            </span>
                                        </div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>License</strong>{userProfile?.license || "Not set"}</div>
                                    </div>
                                )}

                                <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-light)" }}>
                                    <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--error)", marginBottom: "0.5rem" }}>Danger Zone</h4>
                                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        className={styles.formBtnSecondary}
                                        style={{ borderColor: "var(--error)", color: "var(--error)" }}
                                        onClick={handleDeleteAccount}
                                    >
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "reviews" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>Reviews & Ratings</h3>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <svg key={star} width="16" height="16" viewBox="0 0 24 24"
                                                fill={star <= Math.round(userProfile?.rating || 0) ? "var(--gold-500)" : "var(--gray-200)"}
                                            ><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        ))}
                                    </div>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                        {userProfile?.rating || 0}
                                    </span>
                                    <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                                        ({agentReviews.length} review{agentReviews.length !== 1 ? "s" : ""})
                                    </span>
                                </div>
                            </div>
                            <div className={styles.contentCardBody}>
                                {agentReviews.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-tertiary)" }}>
                                        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>⭐</div>
                                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>No Reviews Yet</h4>
                                        <p style={{ fontSize: "0.85rem" }}>When clients leave reviews, they&apos;ll appear here. Great service leads to great reviews!</p>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        {agentReviews.map((review) => (
                                            <div key={review.id} style={{
                                                padding: "1.25rem",
                                                background: "var(--bg-secondary)",
                                                borderRadius: "var(--radius-lg)",
                                                border: "1px solid var(--border-light)",
                                            }}>
                                                {/* Review Header */}
                                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div style={{
                                                            width: "40px", height: "40px", borderRadius: "50%",
                                                            background: review.reviewerAvatar ? "none" : "linear-gradient(135deg, var(--navy-400), var(--navy-600))",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                                                            overflow: "hidden", flexShrink: 0,
                                                        }}>
                                                            {review.reviewerAvatar ? (
                                                                <Image src={review.reviewerAvatar} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                                                            ) : (
                                                                review.reviewerName.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                                                                {review.reviewerName}
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                                <div style={{ display: "flex", gap: "1px" }}>
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <svg key={star} width="13" height="13" viewBox="0 0 24 24"
                                                                            fill={star <= review.rating ? "var(--gold-500)" : "var(--gray-200)"}
                                                                        ><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                                    ))}
                                                                </div>
                                                                <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                                                                    {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {review.propertyTitle && (
                                                        <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "50px", background: "rgba(59,130,246,0.08)", color: "var(--info)", fontWeight: 500 }}>
                                                            {review.propertyTitle.length > 30 ? review.propertyTitle.slice(0, 30) + "..." : review.propertyTitle}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Review Content */}
                                                {review.title && (
                                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: "0.4rem" }}>{review.title}</h4>
                                                )}
                                                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{review.comment}</p>

                                                {/* Existing Response */}
                                                {review.agentResponse && (
                                                    <div style={{ marginTop: "0.75rem", padding: "0.85rem", background: "rgba(212,160,23,0.06)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--gold-500)" }}>
                                                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold-600)", marginBottom: "0.3rem" }}>
                                                            💬 Your Response
                                                        </div>
                                                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{review.agentResponse}</p>
                                                    </div>
                                                )}

                                                {/* Respond Button / Form */}
                                                {!review.agentResponse && (
                                                    <>
                                                        {respondingReview === review.id ? (
                                                            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                                <textarea
                                                                    className={`${styles.formInput} ${styles.formTextarea}`}
                                                                    value={responseText}
                                                                    onChange={(e) => setResponseText(e.target.value)}
                                                                    placeholder="Write your response to this review..."
                                                                    rows={3}
                                                                    autoFocus
                                                                />
                                                                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                                                    <button
                                                                        className={styles.formBtnSecondary}
                                                                        onClick={() => { setRespondingReview(null); setResponseText(""); }}
                                                                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}
                                                                    >Cancel</button>
                                                                    <button
                                                                        className={styles.formBtnPrimary}
                                                                        onClick={() => handleRespondToReview(review.id!)}
                                                                        disabled={!responseText.trim()}
                                                                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem" }}
                                                                    >Post Response</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setRespondingReview(review.id!); setResponseText(""); }}
                                                                style={{
                                                                    marginTop: "0.75rem",
                                                                    display: "flex", alignItems: "center", gap: "0.35rem",
                                                                    fontSize: "0.78rem", color: "var(--gold-600)",
                                                                    cursor: "pointer", padding: "0.3rem 0.6rem",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    border: "1px solid rgba(212,160,23,0.3)",
                                                                    background: "none", transition: "all 0.15s",
                                                                }}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                                Respond
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                {/* Add Property Modal */}
                {showAddModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>Add New Property</h3>
                                <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <form onSubmit={handleAddProperty} className={styles.formGrid}>
                                    {/* Image Upload Zone */}
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Property Images * (max 6)</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--gold-500)"; }}
                                            onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; }}
                                            onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border-color)"; const dt = e.dataTransfer; if (dt.files) handleImageSelect({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>); }}
                                            style={{ border: "2px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "1.5rem", textAlign: "center", cursor: "pointer", background: "var(--bg-tertiary)" }}
                                        >
                                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
                                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Drag & drop images here, or click to browse</p>
                                            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>JPG, PNG, WebP up to 10MB each</p>
                                            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                                                onChange={(e) => handleImageSelect(e)} />
                                        </div>
                                        {imagePreviews.length > 0 && (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.75rem" }}>
                                                {imagePreviews.map((src, i) => (
                                                    <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3" }}>
                                                        <img src={src} alt={`Preview ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        <button type="button" onClick={() => removeImage(i)}
                                                            style={{ position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Property Title *</label>
                                        <input className={styles.formInput} value={newProperty.title}
                                            onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                                            placeholder="e.g., Modern 3-Bedroom Apartment" required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Property Type</label>
                                        <select className={`${styles.formInput} ${styles.formSelect}`} value={newProperty.type}
                                            onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as FirestoreProperty["type"] })}>
                                            <option value="apartment">Apartment</option><option value="house">House</option><option value="villa">Villa</option>
                                            <option value="townhouse">Townhouse</option><option value="land">Land</option><option value="commercial">Commercial</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Listing Type</label>
                                        <select className={`${styles.formInput} ${styles.formSelect}`} value={newProperty.listingType}
                                            onChange={(e) => setNewProperty({ ...newProperty, listingType: e.target.value as "sale" | "rent" })}>
                                            <option value="sale">For Sale</option><option value="rent">For Rent</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Price (KES) *</label>
                                        <input type="number" className={styles.formInput} value={newProperty.price || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, price: Number(e.target.value) })} placeholder="25000000" required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Bedrooms</label>
                                        <input type="number" className={styles.formInput} value={newProperty.bedrooms || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, bedrooms: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Bathrooms</label>
                                        <input type="number" className={styles.formInput} value={newProperty.bathrooms || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, bathrooms: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Area (sqft)</label>
                                        <input type="number" className={styles.formInput} value={newProperty.area || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, area: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>City *</label>
                                        <input className={styles.formInput} value={newProperty.city}
                                            onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })} placeholder="Nairobi" required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Neighborhood</label>
                                        <input className={styles.formInput} value={newProperty.neighborhood}
                                            onChange={(e) => setNewProperty({ ...newProperty, neighborhood: e.target.value })} placeholder="Westlands" />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Address</label>
                                        <input className={styles.formInput} value={newProperty.address}
                                            onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })} placeholder="Full property address" />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>
                                            📍 GPS Coordinates <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-tertiary)" }}>(for accurate map pin)</span>
                                        </label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                            <div>
                                                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", display: "block", marginBottom: "0.2rem" }}>Latitude</label>
                                                <input type="number" step="any" className={styles.formInput} value={newProperty.latitude || ""}
                                                    onChange={(e) => setNewProperty({ ...newProperty, latitude: parseFloat(e.target.value) || 0 })}
                                                    placeholder="e.g., -1.2921" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", display: "block", marginBottom: "0.2rem" }}>Longitude</label>
                                                <input type="number" step="any" className={styles.formInput} value={newProperty.longitude || ""}
                                                    onChange={(e) => setNewProperty({ ...newProperty, longitude: parseFloat(e.target.value) || 0 })}
                                                    placeholder="e.g., 36.8219" />
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                            <button type="button" onClick={() => {
                                                if (!navigator.geolocation) { toast.error("Geolocation not supported by your browser"); return; }
                                                toast.loading("Getting your location...", { id: "geo" });
                                                navigator.geolocation.getCurrentPosition(
                                                    (pos) => {
                                                        setNewProperty({ ...newProperty, latitude: parseFloat(pos.coords.latitude.toFixed(6)), longitude: parseFloat(pos.coords.longitude.toFixed(6)) });
                                                        toast.success("Location captured! ✅", { id: "geo" });
                                                    },
                                                    (err) => { toast.error(err.code === 1 ? "Location permission denied. Please allow access." : "Could not get location. Try again.", { id: "geo" }); },
                                                    { enableHighAccuracy: true, timeout: 10000 }
                                                );
                                            }}
                                                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--gold-500)", background: "rgba(212,160,23,0.08)", cursor: "pointer", color: "var(--gold-600)", fontSize: "0.78rem", fontWeight: 600 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg>
                                                📍 Use My Location
                                            </button>
                                            <button type="button" onClick={() => window.open(`https://www.google.com/maps/@${newProperty.latitude || -1.2921},${newProperty.longitude || 36.8219},15z`, '_blank')}
                                                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 500 }}>
                                                🗺️ Find on Map
                                            </button>
                                        </div>
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "0.3rem" }}>
                                            💡 Tap &quot;Use My Location&quot; when at the property, or right-click Google Maps → &quot;What&apos;s here?&quot;
                                        </p>
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Description</label>
                                        <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={newProperty.description}
                                            onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })} placeholder="Describe your property..." />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Amenities (comma-separated)</label>
                                        <input className={styles.formInput} value={newProperty.amenities}
                                            onChange={(e) => setNewProperty({ ...newProperty, amenities: e.target.value })} placeholder="Swimming Pool, Gym, Parking, Security" />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>
                                            🎬 Virtual Tour URL <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-tertiary)" }}>(optional — YouTube or Matterport)</span>
                                        </label>
                                        <input className={styles.formInput} value={newProperty.virtualTourUrl}
                                            onChange={(e) => setNewProperty({ ...newProperty, virtualTourUrl: e.target.value })}
                                            placeholder="https://www.youtube.com/watch?v=... or https://my.matterport.com/show/?m=..." />
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "0.3rem" }}>
                                            💡 Supported: YouTube links, Matterport 3D tours, or any embeddable video URL.
                                        </p>
                                    </div>
                                    {isSubmitting && uploadProgress > 0 && (
                                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                            <div style={{ background: "var(--gray-200)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                                                <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--gold-500)", transition: "width 0.3s" }} />
                                            </div>
                                            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>Uploading images... {uploadProgress}%</p>
                                        </div>
                                    )}
                                    <div className={styles.formActions}>
                                        <button type="button" className={styles.formBtnSecondary} onClick={() => setShowAddModal(false)}>Cancel</button>
                                        <button type="submit" className={styles.formBtnPrimary} disabled={isSubmitting}>
                                            {isSubmitting ? `Uploading... ${uploadProgress}%` : "Publish Property"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Property Modal */}
                {editingProperty && (
                    <div className={styles.modalOverlay} onClick={() => setEditingProperty(null)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>Edit Property</h3>
                                <button className={styles.modalClose} onClick={() => setEditingProperty(null)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <form onSubmit={handleEditProperty} className={styles.formGrid}>
                                    {/* Existing + New Images */}
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Property Images</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                                            {existingImages.map((src, i) => (
                                                <div key={`ex-${i}`} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3" }}>
                                                    <img src={src} alt={`Image ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, j) => j !== i))}
                                                        style={{ position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                                </div>
                                            ))}
                                            {editImagePreviews.map((src, i) => (
                                                <div key={`new-${i}`} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3", border: "2px solid var(--gold-400)" }}>
                                                    <img src={src} alt={`New ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    <button type="button" onClick={() => removeImage(i, true)}
                                                        style={{ position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px", borderRadius: "50%", background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                        {(existingImages.length + editImagePreviews.length) < 6 && (
                                            <button type="button" onClick={() => editFileInputRef.current?.click()}
                                                style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                                                + Add More Images
                                            </button>
                                        )}
                                        <input ref={editFileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                                            onChange={(e) => handleImageSelect(e, true)} />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Property Title</label>
                                        <input className={styles.formInput} value={editingProperty.title}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Type</label>
                                        <select className={`${styles.formInput} ${styles.formSelect}`} value={editingProperty.type}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, type: e.target.value as FirestoreProperty["type"] })}>
                                            <option value="apartment">Apartment</option><option value="house">House</option><option value="villa">Villa</option>
                                            <option value="townhouse">Townhouse</option><option value="land">Land</option><option value="commercial">Commercial</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Listing Type</label>
                                        <select className={`${styles.formInput} ${styles.formSelect}`} value={editingProperty.listingType}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, listingType: e.target.value as "sale" | "rent" })}>
                                            <option value="sale">For Sale</option><option value="rent">For Rent</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Price (KES)</label>
                                        <input type="number" className={styles.formInput} value={editingProperty.price || ""}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, price: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Bedrooms</label>
                                        <input type="number" className={styles.formInput} value={editingProperty.bedrooms || ""}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, bedrooms: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Bathrooms</label>
                                        <input type="number" className={styles.formInput} value={editingProperty.bathrooms || ""}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, bathrooms: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>City</label>
                                        <input className={styles.formInput} value={editingProperty.city}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, city: e.target.value })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Neighborhood</label>
                                        <input className={styles.formInput} value={editingProperty.neighborhood}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, neighborhood: e.target.value })} />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>
                                            📍 GPS Coordinates <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-tertiary)" }}>(for accurate map pin)</span>
                                        </label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                            <div>
                                                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", display: "block", marginBottom: "0.2rem" }}>Latitude</label>
                                                <input type="number" step="any" className={styles.formInput} value={editingProperty.latitude || ""}
                                                    onChange={(e) => setEditingProperty({ ...editingProperty, latitude: parseFloat(e.target.value) || 0 })}
                                                    placeholder="e.g., -1.2921" />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", display: "block", marginBottom: "0.2rem" }}>Longitude</label>
                                                <input type="number" step="any" className={styles.formInput} value={editingProperty.longitude || ""}
                                                    onChange={(e) => setEditingProperty({ ...editingProperty, longitude: parseFloat(e.target.value) || 0 })}
                                                    placeholder="e.g., 36.8219" />
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                            <button type="button" onClick={() => {
                                                if (!navigator.geolocation) { toast.error("Geolocation not supported by your browser"); return; }
                                                toast.loading("Getting your location...", { id: "geo-edit" });
                                                navigator.geolocation.getCurrentPosition(
                                                    (pos) => {
                                                        setEditingProperty({ ...editingProperty, latitude: parseFloat(pos.coords.latitude.toFixed(6)), longitude: parseFloat(pos.coords.longitude.toFixed(6)) });
                                                        toast.success("Location captured! ✅", { id: "geo-edit" });
                                                    },
                                                    (err) => { toast.error(err.code === 1 ? "Location permission denied. Please allow access." : "Could not get location. Try again.", { id: "geo-edit" }); },
                                                    { enableHighAccuracy: true, timeout: 10000 }
                                                );
                                            }}
                                                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--gold-500)", background: "rgba(212,160,23,0.08)", cursor: "pointer", color: "var(--gold-600)", fontSize: "0.78rem", fontWeight: 600 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg>
                                                📍 Use My Location
                                            </button>
                                            <button type="button" onClick={() => window.open(`https://www.google.com/maps/@${editingProperty.latitude || -1.2921},${editingProperty.longitude || 36.8219},15z`, '_blank')}
                                                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 500 }}>
                                                🗺️ Find on Map
                                            </button>
                                        </div>
                                        <p style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "0.3rem" }}>
                                            💡 Tap &quot;Use My Location&quot; when at the property, or right-click Google Maps → &quot;What&apos;s here?&quot;
                                        </p>
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Description</label>
                                        <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={editingProperty.description}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })} />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>
                                            🎬 Virtual Tour URL <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-tertiary)" }}>(optional)</span>
                                        </label>
                                        <input className={styles.formInput} value={editingProperty.virtualTourUrl || ""}
                                            onChange={(e) => setEditingProperty({ ...editingProperty, virtualTourUrl: e.target.value })}
                                            placeholder="https://www.youtube.com/watch?v=... or https://my.matterport.com/show/?m=..." />
                                    </div>
                                    {isSubmitting && uploadProgress > 0 && (
                                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                            <div style={{ background: "var(--gray-200)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                                                <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--gold-500)", transition: "width 0.3s" }} />
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles.formActions}>
                                        <button type="button" className={styles.formBtnSecondary} onClick={() => setEditingProperty(null)}>Cancel</button>
                                        <button type="submit" className={styles.formBtnPrimary} disabled={isSubmitting}>
                                            {isSubmitting ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reply to Inquiry Modal */}
                {replyingInquiry && (
                    <div className={styles.modalOverlay} onClick={() => setReplyingInquiry(null)}>
                        <div className={styles.modal} style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>Reply to Inquiry</h3>
                                <button className={styles.modalClose} onClick={() => setReplyingInquiry(null)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
                                    <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>From: <strong>{replyingInquiry.senderName}</strong></p>
                                    <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>Re: {replyingInquiry.propertyTitle}</p>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{replyingInquiry.message}</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Your Reply</label>
                                    <textarea className={`${styles.formInput} ${styles.formTextarea}`}
                                        value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply to the buyer..." rows={4} autoFocus />
                                </div>
                                <div className={styles.formActions}>
                                    <button className={styles.formBtnSecondary} onClick={() => setReplyingInquiry(null)}>Cancel</button>
                                    <button className={styles.formBtnPrimary} onClick={handleReplyInquiry} disabled={isSubmitting || !replyText.trim()}>
                                        {isSubmitting ? "Sending..." : "Send Reply"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                </button>
            </div>
        </AgentGate>
    );
}

