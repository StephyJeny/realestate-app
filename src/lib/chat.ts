import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    limit,
} from "firebase/firestore";
import { db } from "./firebase";

// ========================
// TYPES
// ========================

export interface Conversation {
    id?: string;
    participants: string[]; // [buyerId, agentId]
    participantNames: Record<string, string>; // { odwio: "Jane", djoew: "Agent Sarah" }
    participantAvatars: Record<string, string>;
    propertyId?: string;
    propertyTitle?: string;
    lastMessage: string;
    lastMessageAt: Timestamp;
    lastMessageBy: string;
    unreadCount: Record<string, number>; // { odwio: 0, djoew: 2 }
    createdAt?: Timestamp;
}

export interface ChatMessage {
    id?: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    text: string;
    type: "text" | "system";
    createdAt?: Timestamp;
}

// ========================
// CONVERSATION OPERATIONS
// ========================

/**
 * Find or create a conversation between two users, optionally about a property.
 */
export async function getOrCreateConversation(data: {
    currentUserId: string;
    currentUserName: string;
    currentUserAvatar: string;
    otherUserId: string;
    otherUserName: string;
    otherUserAvatar: string;
    propertyId?: string;
    propertyTitle?: string;
}): Promise<string> {
    // Check if conversation already exists between these two users
    const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", data.currentUserId)
    );
    const snap = await getDocs(q);

    // Find existing conversation with these two participants
    for (const docSnap of snap.docs) {
        const convo = docSnap.data() as Conversation;
        if (convo.participants.includes(data.otherUserId)) {
            // If a propertyId is specified and matches, or no property context, reuse this convo
            if (!data.propertyId || convo.propertyId === data.propertyId) {
                return docSnap.id;
            }
        }
    }

    // Also check without property filter — just reuse any existing convo between users
    for (const docSnap of snap.docs) {
        const convo = docSnap.data() as Conversation;
        if (convo.participants.includes(data.otherUserId) && !data.propertyId) {
            return docSnap.id;
        }
    }

    // Create new conversation
    const convoData: Omit<Conversation, "id"> = {
        participants: [data.currentUserId, data.otherUserId],
        participantNames: {
            [data.currentUserId]: data.currentUserName,
            [data.otherUserId]: data.otherUserName,
        },
        participantAvatars: {
            [data.currentUserId]: data.currentUserAvatar || "",
            [data.otherUserId]: data.otherUserAvatar || "",
        },
        propertyId: data.propertyId || "",
        propertyTitle: data.propertyTitle || "",
        lastMessage: "",
        lastMessageAt: Timestamp.now(),
        lastMessageBy: "",
        unreadCount: {
            [data.currentUserId]: 0,
            [data.otherUserId]: 0,
        },
        createdAt: Timestamp.now(),
    };

    const ref = await addDoc(collection(db, "conversations"), {
        ...convoData,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
    });

    // Add a system message
    await addDoc(collection(db, "conversations", ref.id, "messages"), {
        conversationId: ref.id,
        senderId: "system",
        senderName: "System",
        text: data.propertyTitle
            ? `Conversation started about "${data.propertyTitle}"`
            : "Conversation started",
        type: "system",
        createdAt: serverTimestamp(),
    });

    return ref.id;
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    text: string
): Promise<void> {
    // Add message to subcollection
    await addDoc(collection(db, "conversations", conversationId, "messages"), {
        conversationId,
        senderId,
        senderName,
        text: text.trim(),
        type: "text",
        createdAt: serverTimestamp(),
    });

    // Get conversation to find other participant
    const convoRef = doc(db, "conversations", conversationId);
    const convoSnap = await getDoc(convoRef);
    if (convoSnap.exists()) {
        const convo = convoSnap.data() as Conversation;
        const otherUserId = convo.participants.find((p) => p !== senderId) || "";

        // Update conversation metadata
        const newUnreadCount = { ...convo.unreadCount };
        newUnreadCount[otherUserId] = (newUnreadCount[otherUserId] || 0) + 1;

        await updateDoc(convoRef, {
            lastMessage: text.trim().length > 100 ? text.trim().slice(0, 100) + "..." : text.trim(),
            lastMessageAt: serverTimestamp(),
            lastMessageBy: senderId,
            unreadCount: newUnreadCount,
        });
    }
}

/**
 * Mark all messages as read for a user in a conversation.
 */
export async function markConversationRead(
    conversationId: string,
    userId: string
): Promise<void> {
    const convoRef = doc(db, "conversations", conversationId);
    const convoSnap = await getDoc(convoRef);
    if (convoSnap.exists()) {
        const convo = convoSnap.data() as Conversation;
        const newUnreadCount = { ...convo.unreadCount };
        newUnreadCount[userId] = 0;
        await updateDoc(convoRef, { unreadCount: newUnreadCount });
    }
}

/**
 * Get all conversations for a user (one-time fetch).
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
    const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
    // Sort by most recent
    results.sort(
        (a, b) =>
            ((b.lastMessageAt as Timestamp)?.seconds || 0) -
            ((a.lastMessageAt as Timestamp)?.seconds || 0)
    );
    return results;
}

/**
 * Get total unread count for a user across all conversations.
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
    const convos = await getUserConversations(userId);
    return convos.reduce((total, c) => total + (c.unreadCount?.[userId] || 0), 0);
}

// ========================
// REAL-TIME LISTENERS
// ========================

/**
 * Subscribe to conversations for a user — real-time updates.
 */
export function subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
): () => void {
    const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId)
    );

    return onSnapshot(q, (snap) => {
        const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
        results.sort(
            (a, b) =>
                ((b.lastMessageAt as Timestamp)?.seconds || 0) -
                ((a.lastMessageAt as Timestamp)?.seconds || 0)
        );
        callback(results);
    });
}

/**
 * Subscribe to messages in a conversation — real-time updates.
 */
export function subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
): () => void {
    const q = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
        const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
        callback(messages);
    });
}
