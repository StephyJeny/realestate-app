"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    Conversation,
    ChatMessage,
    sendMessage,
    markConversationRead,
    subscribeToConversations,
    subscribeToMessages,
} from "@/lib/chat";
import { Timestamp } from "firebase/firestore";
import styles from "./page.module.css";

function formatTime(ts?: Timestamp): string {
    if (!ts?.seconds) return "";
    const d = new Date(ts.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24 && d.getDate() === now.getDate()) {
        return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
    if (diffHours < 48) return "Yesterday";
    if (diffHours < 168) {
        return d.toLocaleDateString("en-US", { weekday: "short" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(ts?: Timestamp): string {
    if (!ts?.seconds) return "";
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getDateLabel(ts?: Timestamp): string {
    if (!ts?.seconds) return "";
    const d = new Date(ts.seconds * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function MessagesPage() {
    const { user, userProfile, loading } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const searchParams = useSearchParams();

    // Deep-link: auto-open conversation from ?c= query param
    useEffect(() => {
        const convoIdParam = searchParams.get("c");
        if (convoIdParam && conversations.length > 0) {
            const exists = conversations.some((c) => c.id === convoIdParam);
            if (exists) {
                setActiveConvoId(convoIdParam);
                setMobileShowChat(true);
            }
        }
    }, [searchParams, conversations]);

    // Subscribe to conversations (real-time)
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToConversations(user.uid, (convos) => {
            setConversations(convos);
        });
        return () => unsub();
    }, [user]);

    // Subscribe to messages of active conversation (real-time)
    useEffect(() => {
        if (!activeConvoId) {
            setMessages([]);
            return;
        }
        const unsub = subscribeToMessages(activeConvoId, (msgs) => {
            setMessages(msgs);
        });
        return () => unsub();
    }, [activeConvoId]);

    // Mark as read when switching conversations
    useEffect(() => {
        if (activeConvoId && user) {
            markConversationRead(activeConvoId, user.uid).catch(console.error);
        }
    }, [activeConvoId, user]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when switching active convo
    useEffect(() => {
        if (activeConvoId) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [activeConvoId]);

    const handleSend = useCallback(async () => {
        if (!newMessage.trim() || !activeConvoId || !user || !userProfile || sending) return;
        setSending(true);
        const text = newMessage.trim();
        setNewMessage("");
        try {
            await sendMessage(
                activeConvoId,
                user.uid,
                userProfile.displayName || "User",
                text
            );
        } catch (err) {
            console.error("Failed to send message:", err);
            setNewMessage(text); // Restore on failure
        } finally {
            setSending(false);
        }
    }, [newMessage, activeConvoId, user, userProfile, sending]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const openConversation = (convoId: string) => {
        setActiveConvoId(convoId);
        setMobileShowChat(true);
    };

    const goBackToList = () => {
        setMobileShowChat(false);
        setActiveConvoId(null);
    };

    // Filter conversations by search
    const filteredConvos = conversations.filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const otherName = user
            ? Object.entries(c.participantNames || {})
                .filter(([uid]) => uid !== user.uid)
                .map(([, name]) => name)
                .join(", ")
            : "";
        return (
            otherName.toLowerCase().includes(q) ||
            (c.propertyTitle || "").toLowerCase().includes(q) ||
            (c.lastMessage || "").toLowerCase().includes(q)
        );
    });

    const activeConvo = conversations.find((c) => c.id === activeConvoId);
    const otherUserId = activeConvo
        ? activeConvo.participants.find((p) => p !== user?.uid) || ""
        : "";
    const otherUserName = activeConvo?.participantNames?.[otherUserId] || "User";
    const otherUserAvatar = activeConvo?.participantAvatars?.[otherUserId] || "";

    const totalUnread = conversations.reduce(
        (sum, c) => sum + (c.unreadCount?.[user?.uid || ""] || 0),
        0
    );

    if (loading) {
        return (
            <div className={styles.page}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 36, height: 36, border: "3px solid var(--gray-200)", borderTopColor: "var(--gold-500)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.page}>
                <div className={styles.noAuth}>
                    <div style={{ fontSize: "4rem", opacity: 0.3 }}>💬</div>
                    <h1>Sign in to Chat</h1>
                    <p>You need an account to message agents and view conversations.</p>
                    <Link href="/auth/signin" className="btn btn-primary">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.chatLayout}>
                {/* Sidebar — Conversation List */}
                <div className={`${styles.sidebar} ${mobileShowChat ? styles.sidebarHidden : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>
                            💬 Messages
                            {totalUnread > 0 && (
                                <span className={styles.sidebarBadge}>{totalUnread}</span>
                            )}
                        </h2>
                    </div>

                    <div className={styles.sidebarSearch}>
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {filteredConvos.length > 0 ? (
                        <div className={styles.convoList}>
                            {filteredConvos.map((convo) => {
                                const otherId = convo.participants.find((p) => p !== user.uid) || "";
                                const otherName = convo.participantNames?.[otherId] || "User";
                                const otherAvatar = convo.participantAvatars?.[otherId] || "";
                                const unread = convo.unreadCount?.[user.uid] || 0;

                                return (
                                    <div
                                        key={convo.id}
                                        className={`${styles.convoItem} ${activeConvoId === convo.id ? styles.convoItemActive : ""}`}
                                        onClick={() => openConversation(convo.id!)}
                                    >
                                        <div className={styles.convoAvatar}>
                                            {otherAvatar ? (
                                                <img
                                                    src={otherAvatar}
                                                    alt=""
                                                    className={styles.convoAvatarImg}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                otherName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className={styles.convoInfo}>
                                            <div className={styles.convoName}>
                                                <span>{otherName}</span>
                                                <span className={styles.convoTime}>
                                                    {formatTime(convo.lastMessageAt)}
                                                </span>
                                            </div>
                                            <div className={styles.convoPreview}>
                                                {convo.lastMessage || "Start a conversation..."}
                                            </div>
                                            {convo.propertyTitle && (
                                                <div className={styles.convoProperty}>
                                                    🏠 {convo.propertyTitle}
                                                </div>
                                            )}
                                        </div>
                                        {unread > 0 && (
                                            <span className={styles.convoUnread}>{unread}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyConvos}>
                            <div className="emptyIcon">💬</div>
                            <h3>No Conversations Yet</h3>
                            <p>
                                Start a conversation by clicking &quot;Chat with Agent&quot; on any
                                property listing.
                            </p>
                            <Link href="/properties" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                                Browse Properties
                            </Link>
                        </div>
                    )}
                </div>

                {/* Chat Panel — Messages */}
                <div className={`${styles.chatPanel} ${mobileShowChat ? styles.chatPanelVisible : ""}`}>
                    {activeConvo ? (
                        <>
                            {/* Chat Header */}
                            <div className={styles.chatHeader}>
                                <button
                                    className={styles.chatHeaderBack}
                                    onClick={goBackToList}
                                    aria-label="Back to conversations"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                <div className={styles.chatHeaderAvatar}>
                                    {otherUserAvatar ? (
                                        <img
                                            src={otherUserAvatar}
                                            alt=""
                                            className={styles.convoAvatarImg}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        otherUserName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className={styles.chatHeaderInfo}>
                                    <div className={styles.chatHeaderName}>{otherUserName}</div>
                                    {activeConvo.propertyTitle && (
                                        <div className={styles.chatHeaderProperty}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            </svg>
                                            {activeConvo.propertyTitle}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className={styles.messagesArea}>
                                {messages.map((msg, i) => {
                                    // Date divider logic
                                    const showDateDivider =
                                        i === 0 ||
                                        getDateLabel(msg.createdAt) !==
                                        getDateLabel(messages[i - 1]?.createdAt);

                                    if (msg.type === "system") {
                                        return (
                                            <div key={msg.id}>
                                                {showDateDivider && (
                                                    <div className={styles.msgDateDivider}>
                                                        <span className={styles.msgDateDividerText}>
                                                            {getDateLabel(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={styles.msgSystem}>
                                                    <div className={styles.msgSystemBubble}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isSent = msg.senderId === user.uid;

                                    return (
                                        <div key={msg.id}>
                                            {showDateDivider && (
                                                <div className={styles.msgDateDivider}>
                                                    <span className={styles.msgDateDividerText}>
                                                        {getDateLabel(msg.createdAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                className={`${styles.msgBubbleWrap} ${isSent
                                                    ? styles.msgBubbleWrapSent
                                                    : styles.msgBubbleWrapReceived
                                                    }`}
                                            >
                                                <div
                                                    className={`${styles.msgBubble} ${isSent
                                                        ? styles.msgBubbleSent
                                                        : styles.msgBubbleReceived
                                                        }`}
                                                >
                                                    {msg.text}
                                                </div>
                                                <div className={styles.msgTime}>
                                                    {formatMessageTime(msg.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className={styles.inputArea}>
                                <textarea
                                    ref={inputRef}
                                    className={styles.msgInput}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    rows={1}
                                />
                                <button
                                    className={styles.sendBtn}
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || sending}
                                    aria-label="Send message"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.chatPanelEmpty}>
                            <div className={styles.emptyChatIcon}>💬</div>
                            <h2>Select a Conversation</h2>
                            <p>
                                Choose a conversation from the sidebar or start a new one from a
                                property listing.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
