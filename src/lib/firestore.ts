import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    Timestamp,
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
    }
) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
        uid,
        email: data.email,
        displayName: data.displayName,
        phone: data.phone || "",
        avatar: data.avatar || "",
        role: "buyer",
        bio: "",
        savedProperties: [],
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
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
        where("agentId", "==", agentId),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getInquiriesByUser(userId: string) {
    const q = query(
        collection(db, "inquiries"),
        where("senderId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
