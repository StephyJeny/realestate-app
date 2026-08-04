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
    amenities: string[];
    images: string[];
    agentId: string;
    agentName: string;
    agentEmail: string;
    agentPhone: string;
    status: "active" | "pending" | "sold" | "rented";
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

export async function sendInquiry(data: {
    propertyId: string;
    propertyTitle: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    agentId: string;
    message: string;
    type: "inquiry" | "viewing" | "offer";
}) {
    const ref = collection(db, "inquiries");
    return await addDoc(ref, {
        ...data,
        status: "new",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function getInquiriesByAgent(agentId: string) {
    const q = query(
        collection(db, "inquiries"),
        where("agentId", "==", agentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
}

export async function getInquiriesByUser(userId: string) {
    const q = query(
        collection(db, "inquiries"),
        where("senderId", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
}

export async function getAllInquiries() {
    const snap = await getDocs(collection(db, "inquiries"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => ((b.createdAt as Timestamp)?.seconds || 0) - ((a.createdAt as Timestamp)?.seconds || 0));
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
