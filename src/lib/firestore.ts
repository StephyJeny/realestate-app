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
    virtualTourUrl?: string;
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

export interface OfferDetails {
    offeredPrice: number;
    askingPrice: number;
    downPaymentPercent: number;
    downPaymentAmount: number;
    financingType: "cash" | "mortgage" | "installments";
    moveInDate: string;
    contingencies: string[];
    specialConditions?: string;
    loiNumber: string;
    offerStatus: "pending" | "accepted" | "countered" | "rejected";
    counterPrice?: number;
    counterTerms?: string;
    counteredAt?: Timestamp;
    respondedAt?: Timestamp;
    history?: {
        action: "submitted" | "countered" | "accepted" | "rejected";
        actor: string;
        actorName: string;
        price?: number;
        note?: string;
        timestamp: string;
    }[];
}

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
    stage?: "new" | "contacted" | "viewing_scheduled" | "offer_made" | "closed";
    offerDetails?: OfferDetails;
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
    offerDetails?: OfferDetails;
}) {
    const ref = collection(db, "inquiries");
    const inquiryRef = await addDoc(ref, {
        ...data,
        status: data.type === "offer" ? "pending" : "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Create a dashboard notification for the agent
    const typeLabel = data.type === "viewing" ? "Viewing Request" : data.type === "offer" ? "Digital Offer" : "Inquiry";
    const titleText = data.type === "offer"
        ? `New Formal Offer: KES ${data.offerDetails?.offeredPrice?.toLocaleString() || ""} 📝`
        : `New ${typeLabel} 📩`;

    await addDoc(collection(db, "notifications"), {
        userId: data.agentId,
        type: data.type === "offer" ? "new_offer" : "new_inquiry",
        title: titleText,
        message: `${data.senderName} submitted a ${typeLabel.toLowerCase()} for "${data.propertyTitle}": "${data.message.length > 100 ? data.message.slice(0, 100) + "..." : data.message}"`,
        propertyId: data.propertyId,
        inquiryId: inquiryRef.id,
        read: false,
        createdAt: serverTimestamp(),
    });

    return inquiryRef;
}

export async function submitOffer(data: {
    propertyId: string;
    propertyTitle: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    agentId: string;
    agentName?: string;
    offerDetails: OfferDetails;
}) {
    const message = `Formal Letter of Intent to purchase for KES ${data.offerDetails.offeredPrice.toLocaleString()} with ${data.offerDetails.financingType.toUpperCase()} financing (${data.offerDetails.downPaymentPercent}% down payment). Target move-in: ${data.offerDetails.moveInDate}.`;
    return sendInquiry({
        ...data,
        message,
        type: "offer",
        offerDetails: data.offerDetails,
    });
}

export async function respondToOffer(params: {
    inquiryId: string;
    action: "accept" | "counter" | "reject";
    actorId: string;
    actorName: string;
    counterPrice?: number;
    counterTerms?: string;
    note?: string;
}) {
    const ref = doc(db, "inquiries", params.inquiryId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Offer not found");

    const inq = snap.data() as Inquiry;
    const currentOffer = inq.offerDetails || {
        offeredPrice: 0,
        askingPrice: 0,
        downPaymentPercent: 10,
        downPaymentAmount: 0,
        financingType: "cash",
        moveInDate: "",
        contingencies: [],
        loiNumber: `EV-LOI-${new Date().getFullYear()}-0000`,
        offerStatus: "pending",
    };

    const newStatus = params.action === "accept"
        ? "accepted"
        : params.action === "counter"
        ? "countered"
        : "rejected";

    const historyEntry = {
        action: newStatus as any,
        actor: params.actorId,
        actorName: params.actorName,
        price: params.counterPrice || currentOffer.offeredPrice,
        note: params.note || params.counterTerms || "",
        timestamp: new Date().toISOString(),
    };

    const updatedOffer: OfferDetails = {
        ...currentOffer,
        offerStatus: newStatus,
        counterPrice: params.counterPrice,
        counterTerms: params.counterTerms,
        respondedAt: serverTimestamp() as any,
        history: [...(currentOffer.history || []), historyEntry],
    };

    await updateDoc(ref, {
        offerDetails: updatedOffer,
        status: newStatus,
        updatedAt: serverTimestamp(),
    });

    // If accepted, update the property listing to 'under_offer'
    if (params.action === "accept" && inq.propertyId) {
        try {
            const propRef = doc(db, "properties", inq.propertyId);
            await updateDoc(propRef, {
                status: "under_offer",
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.warn("Could not update property status to under_offer:", e);
        }
    }

    // Notify the buyer of the response
    const actionLabel = params.action === "accept"
        ? "Accepted 🎉"
        : params.action === "counter"
        ? `Counter-Offered with KES ${params.counterPrice?.toLocaleString()} ⚖️`
        : "Declined ❌";

    await addDoc(collection(db, "notifications"), {
        userId: inq.senderId,
        type: `offer_${params.action}`,
        title: `Offer ${actionLabel}`,
        message: `${params.actorName} has ${params.action === "accept" ? "accepted your offer" : params.action === "counter" ? `sent a counter-offer of KES ${params.counterPrice?.toLocaleString()}` : "declined your offer"} for "${inq.propertyTitle}".`,
        propertyId: inq.propertyId,
        inquiryId: params.inquiryId,
        read: false,
        createdAt: serverTimestamp(),
    });

    return updatedOffer;
}

// Payment Recording (M-Pesa STK Push / Card / Listing Promotion)
export interface PaymentRecord {
    id?: string;
    userId: string;
    propertyId?: string;
    propertyTitle?: string;
    amount: number;
    currency: string;
    purpose: "reservation" | "viewing_fee" | "listing_promotion";
    mpesaReceiptNumber: string;
    phoneNumber: string;
    status: "completed" | "failed";
    paymentMethod: "mpesa" | "card";
    promotionTier?: "featured_7" | "featured_14" | "featured_30";
    createdAt?: Timestamp;
}

export async function recordPayment(payment: PaymentRecord) {
    const colRef = collection(db, "payments");
    const docRef = await addDoc(colRef, {
        ...payment,
        createdAt: serverTimestamp(),
    });

    // If listing promotion, activate promotion on property
    if (payment.purpose === "listing_promotion" && payment.propertyId) {
        try {
            const propRef = doc(db, "properties", payment.propertyId);
            const days = payment.promotionTier === "featured_30" ? 30 : payment.promotionTier === "featured_14" ? 14 : 7;
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + days);

            await updateDoc(propRef, {
                isFeatured: true,
                promotedUntil: expiry.toISOString(),
                promotionTier: payment.promotionTier || "featured_7",
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            console.error("Failed to boost property status after payment:", err);
        }
    }

    return docRef;
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

export async function updateInquiryStage(
    inquiryId: string,
    stage: "new" | "contacted" | "viewing_scheduled" | "offer_made" | "closed"
) {
    const ref = doc(db, "inquiries", inquiryId);
    await updateDoc(ref, {
        stage,
        status: stage,
        updatedAt: serverTimestamp(),
    });
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

export interface NewsletterSubscriber {
    id: string;
    email: string;
    subscribedAt: Date | null;
    active: boolean;
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const snap = await getDocs(
        query(collection(db, "newsletter_subscribers"), orderBy("subscribedAt", "desc"))
    );
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            email: data.email,
            subscribedAt: data.subscribedAt?.toDate?.() || null,
            active: data.active ?? true,
        };
    });
}

export async function toggleSubscriberActive(subId: string, active: boolean): Promise<void> {
    const ref = doc(db, "newsletter_subscribers", subId);
    await updateDoc(ref, { active });
}

export async function deleteSubscriber(subId: string): Promise<void> {
    const ref = doc(db, "newsletter_subscribers", subId);
    await deleteDoc(ref);
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

// ========================
// SHARED COLLECTIONS (CO-BUYING / FAMILY BOARD)
// ========================

export interface CollectionComment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
}

export interface CollectionItem {
    propertyId: string;
    propertyTitle: string;
    propertyPrice: number;
    propertyCurrency?: string;
    propertyImage: string;
    city: string;
    neighborhood?: string;
    addedBy: string;
    addedByName: string;
    addedAt: string;
    votes: Record<string, "up" | "down">; // userId -> vote
    comments: CollectionComment[];
}

export interface SharedCollection {
    id?: string;
    title: string;
    description?: string;
    createdBy: string;
    createdByName: string;
    createdByEmail: string;
    members: string[]; // user IDs or email addresses
    memberNames?: Record<string, string>; // userId/email -> display name
    items: CollectionItem[];
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

const LOCAL_COLLECTIONS_KEY = "ev_shared_collections";

function getLocalCollections(): SharedCollection[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(LOCAL_COLLECTIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalCollections(cols: SharedCollection[]) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(LOCAL_COLLECTIONS_KEY, JSON.stringify(cols));
    } catch (e) {
        console.error("Local storage error:", e);
    }
}

export async function createSharedCollection(
    data: Omit<SharedCollection, "id" | "createdAt" | "updatedAt">
): Promise<string> {
    try {
        const colRef = collection(db, "shared_collections");
        const docRef = await addDoc(colRef, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (err) {
        console.warn("Firestore collection create fallback to local:", err);
        const id = `col-${Date.now()}`;
        const newCol: SharedCollection = {
            ...data,
            id,
        };
        const list = getLocalCollections();
        list.unshift(newCol);
        saveLocalCollections(list);
        return id;
    }
}

export async function getSharedCollectionsByUser(userId: string, email?: string): Promise<SharedCollection[]> {
    const list: SharedCollection[] = [];
    try {
        // Query by createdBy
        const q1 = query(collection(db, "shared_collections"), where("createdBy", "==", userId));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => list.push({ id: d.id, ...d.data() } as SharedCollection));

        // Query by members
        if (email) {
            const q2 = query(collection(db, "shared_collections"), where("members", "array-contains", email.toLowerCase()));
            const snap2 = await getDocs(q2);
            snap2.forEach((d) => {
                if (!list.some((existing) => existing.id === d.id)) {
                    list.push({ id: d.id, ...d.data() } as SharedCollection);
                }
            });
        }
    } catch (err) {
        console.warn("Firestore get collections error, using local fallback:", err);
    }

    // Merge with local fallback
    const local = getLocalCollections().filter(
        (c) => c.createdBy === userId || (email && c.members?.includes(email.toLowerCase()))
    );
    for (const l of local) {
        if (!list.some((existing) => existing.id === l.id)) {
            list.push(l);
        }
    }

    return list;
}

export async function getSharedCollectionById(collectionId: string): Promise<SharedCollection | null> {
    try {
        const ref = doc(db, "shared_collections", collectionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as SharedCollection;
        }
    } catch (err) {
        console.warn("Firestore get collection by ID error:", err);
    }

    const local = getLocalCollections().find((c) => c.id === collectionId);
    return local || null;
}

export async function addPropertyToSharedCollection(
    collectionId: string,
    item: Omit<CollectionItem, "votes" | "comments">
) {
    const fullItem: CollectionItem = {
        ...item,
        votes: {},
        comments: [],
    };

    try {
        const ref = doc(db, "shared_collections", collectionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const current = (snap.data().items || []) as CollectionItem[];
            if (!current.some((i) => i.propertyId === item.propertyId)) {
                await updateDoc(ref, {
                    items: [...current, fullItem],
                    updatedAt: serverTimestamp(),
                });
            }
            return;
        }
    } catch (err) {
        console.warn("Firestore add property fallback:", err);
    }

    const local = getLocalCollections();
    const target = local.find((c) => c.id === collectionId);
    if (target) {
        if (!target.items.some((i) => i.propertyId === item.propertyId)) {
            target.items.push(fullItem);
            saveLocalCollections(local);
        }
    }
}

export async function removePropertyFromSharedCollection(collectionId: string, propertyId: string) {
    try {
        const ref = doc(db, "shared_collections", collectionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const current = (snap.data().items || []) as CollectionItem[];
            await updateDoc(ref, {
                items: current.filter((i) => i.propertyId !== propertyId),
                updatedAt: serverTimestamp(),
            });
            return;
        }
    } catch (err) {
        console.warn("Firestore remove property fallback:", err);
    }

    const local = getLocalCollections();
    const target = local.find((c) => c.id === collectionId);
    if (target) {
        target.items = target.items.filter((i) => i.propertyId !== propertyId);
        saveLocalCollections(local);
    }
}

export async function voteOnCollectionProperty(
    collectionId: string,
    propertyId: string,
    userId: string,
    vote: "up" | "down" | "remove"
) {
    try {
        const ref = doc(db, "shared_collections", collectionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const current = (snap.data().items || []) as CollectionItem[];
            const updated = current.map((i) => {
                if (i.propertyId !== propertyId) return i;
                const newVotes = { ...(i.votes || {}) };
                if (vote === "remove") {
                    delete newVotes[userId];
                } else {
                    newVotes[userId] = vote;
                }
                return { ...i, votes: newVotes };
            });
            await updateDoc(ref, { items: updated, updatedAt: serverTimestamp() });
            return;
        }
    } catch (err) {
        console.warn("Firestore vote fallback:", err);
    }

    const local = getLocalCollections();
    const target = local.find((c) => c.id === collectionId);
    if (target) {
        target.items = target.items.map((i) => {
            if (i.propertyId !== propertyId) return i;
            const newVotes = { ...(i.votes || {}) };
            if (vote === "remove") {
                delete newVotes[userId];
            } else {
                newVotes[userId] = vote;
            }
            return { ...i, votes: newVotes };
        });
        saveLocalCollections(local);
    }
}

export async function addCommentToCollectionProperty(
    collectionId: string,
    propertyId: string,
    comment: Omit<CollectionComment, "id" | "createdAt">
) {
    const fullComment: CollectionComment = {
        ...comment,
        id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
    };

    try {
        const ref = doc(db, "shared_collections", collectionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const current = (snap.data().items || []) as CollectionItem[];
            const updated = current.map((i) => {
                if (i.propertyId !== propertyId) return i;
                return {
                    ...i,
                    comments: [...(i.comments || []), fullComment],
                };
            });
            await updateDoc(ref, { items: updated, updatedAt: serverTimestamp() });
            return fullComment;
        }
    } catch (err) {
        console.warn("Firestore comment fallback:", err);
    }

    const local = getLocalCollections();
    const target = local.find((c) => c.id === collectionId);
    if (target) {
        target.items = target.items.map((i) => {
            if (i.propertyId !== propertyId) return i;
            return {
                ...i,
                comments: [...(i.comments || []), fullComment],
            };
        });
        saveLocalCollections(local);
    }
    return fullComment;
}

export async function inviteMemberToSharedCollection(
    collectionId: string,
    email: string,
    name?: string
) {
    const cleanEmail = email.toLowerCase().trim();
    try {
        const ref = doc(db, "shared_collections", collectionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const currentMembers = (snap.data().members || []) as string[];
            if (!currentMembers.includes(cleanEmail)) {
                await updateDoc(ref, {
                    members: arrayUnion(cleanEmail),
                    ...(name ? { [`memberNames.${cleanEmail}`]: name } : {}),
                    updatedAt: serverTimestamp(),
                });
            }
            return;
        }
    } catch (err) {
        console.warn("Firestore invite member fallback:", err);
    }

    const local = getLocalCollections();
    const target = local.find((c) => c.id === collectionId);
    if (target) {
        if (!target.members.includes(cleanEmail)) {
            target.members.push(cleanEmail);
            if (name) {
                target.memberNames = target.memberNames || {};
                target.memberNames[cleanEmail] = name;
            }
            saveLocalCollections(local);
        }
    }
}
