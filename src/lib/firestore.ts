import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    Timestamp,
    limit,
} from "firebase/firestore";
import { db } from "./firebase";

// ========================
// USER OPERATIONS
// ========================

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    phone: string;
    avatar: string;
    role: "buyer" | "agent" | "admin";
    bio: string;
    savedProperties: string[];
    isVerified: boolean;
    // Agent-specific fields
    agentStatus?: "pending" | "approved" | "rejected";
    agentCode?: string;
    agentCodeVerified?: boolean;
    agency?: string;
    specialization?: string;
    experience?: string;
    license?: string;
    location?: string;
    propertiesCount?: number;
    rating?: number;
    totalReviews?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export async function createUserProfile(
    uid: string,
    data: {
        email: string;
        displayName: string;
        phone?: string;
        avatar?: string;
        role?: "buyer" | "agent";
        agency?: string;
        specialization?: string;
        experience?: string;
        license?: string;
        location?: string;
    }
) {
    const userRef = doc(db, "users", uid);
    const role = data.role || "buyer";

    const profileData: Record<string, unknown> = {
        uid,
        email: data.email,
        displayName: data.displayName,
        phone: data.phone || "",
        avatar: data.avatar || "",
        role,
        bio: "",
        savedProperties: [],
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Add agent-specific fields
    if (role === "agent") {
        profileData.agentStatus = "pending";
        profileData.agentCode = "";
        profileData.agentCodeVerified = false;
        profileData.agency = data.agency || "";
        profileData.specialization = data.specialization || "";
        profileData.experience = data.experience || "";
        profileData.license = data.license || "";
        profileData.location = data.location || "";
        profileData.propertiesCount = 0;
        profileData.rating = 0;
        profileData.totalReviews = 0;
    }

    await setDoc(userRef, profileData);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function checkUserExistsByEmail(email: string): Promise<boolean> {
    const q = query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase().trim()),
        limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
}

export async function updateUserProfile(
    uid: string,
    data: Partial<UserProfile>
) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
}

// ========================
// FAVORITES
// ========================

export async function addToFavorites(uid: string, propertyId: string) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        savedProperties: arrayUnion(propertyId),
        updatedAt: serverTimestamp(),
    });
}

export async function removeFromFavorites(uid: string, propertyId: string) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        savedProperties: arrayRemove(propertyId),
        updatedAt: serverTimestamp(),
    });
}

// ========================
// ADMIN: USER MANAGEMENT
// ========================

export async function getAllUsers(): Promise<UserProfile[]> {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProfile);
}

export async function getPendingAgents(): Promise<UserProfile[]> {
    const q = query(
        collection(db, "users"),
        where("role", "==", "agent"),
        where("agentStatus", "==", "pending")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProfile);
}

export async function getApprovedAgents(): Promise<UserProfile[]> {
    const q = query(
        collection(db, "users"),
        where("role", "==", "agent"),
        where("agentStatus", "==", "approved")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProfile);
}

export function generateAgentCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "EV-";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function approveAgent(agentUid: string): Promise<string> {
    const code = generateAgentCode();
    const userRef = doc(db, "users", agentUid);
    await updateDoc(userRef, {
        agentStatus: "approved",
        agentCode: code,
        isVerified: true,
        updatedAt: serverTimestamp(),
    });

    // Create a notification for the agent
    await addDoc(collection(db, "notifications"), {
        userId: agentUid,
        type: "agent_approved",
        title: "Agent Application Approved! 🎉",
        message: `Congratulations! Your agent application has been approved. Your agent verification code is: ${code}. Use this code to verify your agent status.`,
        agentCode: code,
        read: false,
        createdAt: serverTimestamp(),
    });

    return code;
}

export async function rejectAgent(agentUid: string, reason?: string) {
    const userRef = doc(db, "users", agentUid);
    await updateDoc(userRef, {
        agentStatus: "rejected",
        updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
        userId: agentUid,
        type: "agent_rejected",
        title: "Agent Application Update",
        message: reason || "Your agent application has been reviewed and was not approved at this time. Please contact support for more information.",
        read: false,
        createdAt: serverTimestamp(),
    });
}

export async function verifyAgentCode(uid: string, code: string): Promise<boolean> {
    const profile = await getUserProfile(uid);
    if (profile && profile.agentCode === code) {
        await updateDoc(doc(db, "users", uid), {
            agentCodeVerified: true,
            updatedAt: serverTimestamp(),
        });
        return true;
    }
    return false;
}

export async function deleteUser(uid: string) {
    await deleteDoc(doc(db, "users", uid));
}

// ========================
// NOTIFICATIONS
// ========================

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    agentCode?: string;
    read: boolean;
    createdAt: Timestamp;
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
    // Sort client-side to avoid requiring a composite index
    results.sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
    return results.slice(0, 20);
}

export async function markNotificationRead(notificationId: string) {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

// ========================
// PROPERTY OPERATIONS (Firestore-backed)
// ========================

export interface FirestoreProperty {
    id?: string;
    title: string;
    description: string;
    type: "apartment" | "house" | "villa" | "land" | "commercial" | "townhouse";
    listingType: "sale" | "rent";
    price: number;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    yearBuilt: number;
    address: string;
    city: string;
    neighborhood: string;
    latitude?: number;
    longitude?: number;
    amenities: string[];
    images: string[];
    agentId: string;
    agentName: string;
    agentEmail: string;
    agentPhone: string;
    status: "active" | "pending" | "sold" | "rented" | "under_offer" | "price_reduced";
    isFeatured: boolean;
    views: number;
    favorites: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export async function addProperty(data: Omit<FirestoreProperty, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const ref = await addDoc(collection(db, "properties"), {
        ...data,
        views: 0,
        favorites: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Update agent's property count
    const agentRef = doc(db, "users", data.agentId);
    const agentSnap = await getDoc(agentRef);
    if (agentSnap.exists()) {
        const current = agentSnap.data().propertiesCount || 0;
        await updateDoc(agentRef, { propertiesCount: current + 1 });
    }

    return ref.id;
}

export async function updateProperty(
    propertyId: string,
    data: Partial<FirestoreProperty>
) {
    const ref = doc(db, "properties", propertyId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProperty(propertyId: string, agentId: string) {
    await deleteDoc(doc(db, "properties", propertyId));

    // Decrement agent's property count
    const agentRef = doc(db, "users", agentId);
    const agentSnap = await getDoc(agentRef);
    if (agentSnap.exists()) {
        const current = agentSnap.data().propertiesCount || 1;
        await updateDoc(agentRef, { propertiesCount: Math.max(0, current - 1) });
    }
}

export async function getPropertiesByAgent(agentId: string): Promise<FirestoreProperty[]> {
    const q = query(
        collection(db, "properties"),
        where("agentId", "==", agentId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProperty));
    // Sort client-side to avoid requiring a composite index
    results.sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
    return results;
}

export async function getAllProperties(): Promise<FirestoreProperty[]> {
    const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProperty));
}

export async function getPropertyById(propertyId: string): Promise<FirestoreProperty | null> {
    const ref = doc(db, "properties", propertyId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreProperty) : null;
}

// ========================
// INQUIRY OPERATIONS
// ========================

export interface Inquiry {
    id?: string;
    propertyId: string;
    propertyTitle: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    agentId: string;
    message: string;
    type: "inquiry" | "viewing" | "offer";
    status: string;
    agentReply?: string;
    repliedAt?: Timestamp;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export async function sendInquiry(data: {
    propertyId: string;
    propertyTitle: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    agentId: string;
    agentName?: string;
    message: string;
    type: "inquiry" | "viewing" | "offer";
}) {
    const ref = collection(db, "inquiries");
    const inquiryRef = await addDoc(ref, {
        ...data,
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Create a dashboard notification for the agent
    const typeLabel = data.type === "viewing" ? "Viewing Request" : data.type === "offer" ? "Offer" : "Inquiry";
    await addDoc(collection(db, "notifications"), {
        userId: data.agentId,
        type: "new_inquiry",
        title: `New ${typeLabel} 📩`,
        message: `${data.senderName} sent a ${typeLabel.toLowerCase()} for "${data.propertyTitle}": "${data.message.length > 100 ? data.message.slice(0, 100) + "..." : data.message}"`,
        propertyId: data.propertyId,
        inquiryId: inquiryRef.id,
        read: false,
        createdAt: serverTimestamp(),
    });

    return inquiryRef;
}

export async function getInquiriesByAgent(agentId: string): Promise<Inquiry[]> {
    const q = query(
        collection(db, "inquiries"),
        where("agentId", "==", agentId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry));
    return results.sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
}

export async function getInquiriesByUser(userId: string): Promise<Inquiry[]> {
    const q = query(
        collection(db, "inquiries"),
        where("senderId", "==", userId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry));
    return results.sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
}

export async function getAllInquiries(): Promise<Inquiry[]> {
    const snap = await getDocs(collection(db, "inquiries"));
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Inquiry));
    return results.sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
}

export async function updateInquiryStatus(inquiryId: string, status: string) {
    const ref = doc(db, "inquiries", inquiryId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

export async function replyToInquiry(inquiryId: string, agentId: string, agentName: string, reply: string) {
    // Update the inquiry with the agent's reply
    const ref = doc(db, "inquiries", inquiryId);
    await updateDoc(ref, {
        agentReply: reply,
        status: "replied",
        repliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Get the inquiry to know who to notify
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const inquiry = snap.data();
        // Create a notification for the buyer
        await addDoc(collection(db, "notifications"), {
            userId: inquiry.senderId,
            type: "inquiry_reply",
            title: `Reply from ${agentName} 💬`,
            message: `${agentName} replied to your inquiry about "${inquiry.propertyTitle}": "${reply.length > 120 ? reply.slice(0, 120) + "..." : reply}"`,
            propertyId: inquiry.propertyId,
            inquiryId: inquiryId,
            read: false,
            createdAt: serverTimestamp(),
        });
    }
}

// ========================
// ADMIN STATS
// ========================

export async function getAdminStats() {
    const usersSnap = await getDocs(collection(db, "users"));
    const propertiesSnap = await getDocs(collection(db, "properties"));
    const inquiriesSnap = await getDocs(collection(db, "inquiries"));

    const users = usersSnap.docs.map((d) => d.data());
    const buyers = users.filter((u) => u.role === "buyer");
    const agents = users.filter((u) => u.role === "agent");
    const pendingAgents = agents.filter((a) => a.agentStatus === "pending");
    const approvedAgents = agents.filter((a) => a.agentStatus === "approved");

    return {
        totalUsers: users.length,
        totalBuyers: buyers.length,
        totalAgents: agents.length,
        pendingAgents: pendingAgents.length,
        approvedAgents: approvedAgents.length,
        totalProperties: propertiesSnap.docs.length,
        totalInquiries: inquiriesSnap.docs.length,
    };
}

// ========================
// NEWSLETTER SUBSCRIPTIONS
// ========================

export async function subscribeNewsletter(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate by querying (no read restriction on own doc needed)
    try {
        const q = query(
            collection(db, "newsletter_subscribers"),
            where("email", "==", normalizedEmail)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            throw new Error("already_subscribed");
        }
    } catch (err: unknown) {
        // If it's our own "already_subscribed" error, re-throw
        if (err instanceof Error && err.message === "already_subscribed") throw err;
        // Otherwise the query failed (permissions) — just try to add anyway
        console.warn("Could not check duplicates, proceeding with add:", err);
    }

    await addDoc(collection(db, "newsletter_subscribers"), {
        email: normalizedEmail,
        subscribedAt: serverTimestamp(),
        active: true,
    });
}

// ========================
// REVIEWS & RATINGS
// ========================

export interface Review {
    id?: string;
    agentId: string;
    agentName: string;
    reviewerId: string;
    reviewerName: string;
    reviewerAvatar: string;
    propertyId?: string;
    propertyTitle?: string;
    rating: number; // 1-5
    title: string;
    comment: string;
    agentResponse?: string;
    agentRespondedAt?: Timestamp;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export async function submitReview(data: Omit<Review, "id" | "createdAt" | "updatedAt" | "helpfulCount">): Promise<string> {
    // Check if user already reviewed this agent (one review per agent per user)
    const existingQ = query(
        collection(db, "reviews"),
        where("agentId", "==", data.agentId),
        where("reviewerId", "==", data.reviewerId)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
        throw new Error("already_reviewed");
    }

    const ref = await addDoc(collection(db, "reviews"), {
        ...data,
        helpfulCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Recalculate agent's average rating
    await recalculateAgentRating(data.agentId);

    // Send notification to agent
    await addDoc(collection(db, "notifications"), {
        userId: data.agentId,
        type: "new_review",
        title: "New Review ⭐",
        message: `${data.reviewerName} left a ${data.rating}-star review: "${data.comment.length > 100 ? data.comment.slice(0, 100) + "..." : data.comment}"`,
        read: false,
        createdAt: serverTimestamp(),
    });

    return ref.id;
}

export async function getReviewsByAgent(agentId: string): Promise<Review[]> {
    const q = query(
        collection(db, "reviews"),
        where("agentId", "==", agentId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    return results.sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
}

export async function getReviewsByProperty(propertyId: string): Promise<Review[]> {
    const q = query(
        collection(db, "reviews"),
        where("propertyId", "==", propertyId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    return results.sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
}

export async function respondToReview(reviewId: string, response: string) {
    const ref = doc(db, "reviews", reviewId);
    await updateDoc(ref, {
        agentResponse: response,
        agentRespondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function deleteReview(reviewId: string, agentId: string) {
    await deleteDoc(doc(db, "reviews", reviewId));
    await recalculateAgentRating(agentId);
}

export async function markReviewHelpful(reviewId: string) {
    const ref = doc(db, "reviews", reviewId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const current = snap.data().helpfulCount || 0;
        await updateDoc(ref, { helpfulCount: current + 1 });
    }
}

async function recalculateAgentRating(agentId: string) {
    const reviews = await getReviewsByAgent(agentId);
    if (reviews.length === 0) {
        await updateDoc(doc(db, "users", agentId), {
            rating: 0,
            totalReviews: 0,
            updatedAt: serverTimestamp(),
        });
        return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;

    await updateDoc(doc(db, "users", agentId), {
        rating: avgRating,
        totalReviews: reviews.length,
        updatedAt: serverTimestamp(),
    });
}
