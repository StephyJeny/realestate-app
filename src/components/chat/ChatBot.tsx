"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./ChatBot.module.css";

interface Message {
    id: string;
    text: string;
    sender: "bot" | "user";
    timestamp: Date;
    options?: QuickOption[];
}

interface QuickOption {
    label: string;
    value: string;
}

const INITIAL_OPTIONS: QuickOption[] = [
    { label: "🏠 Buying a property", value: "I want to buy a property" },
    { label: "🔑 Renting a property", value: "I want to rent a property" },
    { label: "💰 Property pricing", value: "What are the property prices?" },
    { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
    { label: "📋 How it works", value: "How does the process work?" },
];

const AI_RESPONSES: Record<string, { text: string; options?: QuickOption[] }> = {
    "buy": {
        text: "Great choice! 🏠 We have a wide selection of properties for sale across Kenya. You can:\n\n• Browse our listings at the Properties page\n• Filter by location, price, bedrooms, and property type\n• Schedule viewings directly with our agents\n\nWhat area are you interested in?",
        options: [
            { label: "📍 Nairobi", value: "I'm looking for properties in Nairobi" },
            { label: "🌊 Mombasa", value: "I'm looking for properties in Mombasa" },
            { label: "💰 Under KES 30M", value: "Show me properties under 30 million" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
        ],
    },
    "rent": {
        text: "We'd love to help you find the perfect rental! 🔑\n\nWe have apartments, houses, and villas available for rent in prime locations. Our rental prices range from KES 50,000 to KES 500,000+/month.\n\nWhat type of property are you looking for?",
        options: [
            { label: "🏢 Apartment", value: "I need a rental apartment" },
            { label: "🏡 House", value: "I need a rental house" },
            { label: "🏛️ Villa", value: "I need a rental villa" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
        ],
    },
    "price": {
        text: "Here's a general pricing guide for properties in Kenya 💰:\n\n🏢 **Apartments:** KES 5M – 35M\n🏠 **Houses:** KES 15M – 80M\n🏛️ **Villas:** KES 40M – 150M+\n🏘️ **Townhouses:** KES 12M – 50M\n🌿 **Land:** KES 3M – 100M+\n\nPrices vary by location and amenities. Want to see specific listings?",
        options: [
            { label: "📋 View listings", value: "Show me property listings" },
            { label: "💵 Most affordable", value: "What are the most affordable options?" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
        ],
    },
    "agent": {
        text: "I'll connect you with one of our expert agents right away! 👋\n\nYou can reach our team through:\n\n📞 **Phone:** +254 700 123 456\n📧 **Email:** hello@estatevue.com\n💬 **WhatsApp:** +254 700 123 456\n\nOr visit our Agents page to find a specialist for your needs. Our agents are available Mon-Sat, 8AM-6PM EAT.",
        options: [
            { label: "📞 Call now", value: "call_agent" },
            { label: "💬 WhatsApp", value: "whatsapp_agent" },
            { label: "👥 View all agents", value: "view_agents" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "process": {
        text: "Here's how it works at EstateVue 📋:\n\n**1. Search** — Browse our listings and use filters to find properties that match your needs.\n\n**2. Schedule a Viewing** — Contact our agents to arrange in-person or virtual property tours.\n\n**3. Make an Offer** — Our team helps you negotiate the best deal.\n\n**4. Close the Deal** — We handle the paperwork and legal processes until you get your keys! 🔑\n\nReady to start?",
        options: [
            { label: "🏠 Browse properties", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "nairobi": {
        text: "Nairobi has some amazing neighborhoods! 📍\n\n🌳 **Karen** — Spacious homes, leafy suburbs (KES 30M–120M)\n🏙️ **Westlands** — Modern apartments, vibrant nightlife (KES 10M–40M)\n💎 **Kilimani** — Central location, great amenities (KES 8M–35M)\n🌿 **Runda** — Luxury estates, top security (KES 60M–200M)\n🏡 **Kitisuru** — Family-friendly, green spaces (KES 25M–80M)\n\nWhich area interests you?",
        options: [
            { label: "📋 View Nairobi listings", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "mombasa": {
        text: "Mombasa offers beautiful coastal living! 🌊\n\n🏖️ **Nyali** — Beach proximity, luxury villas (KES 25M–100M)\n🌴 **Bamburi** — Affordable apartments, vibrant area (KES 5M–20M)\n🛳️ **Tudor** — Heritage charm, waterfront views (KES 8M–30M)\n\nPerfect for vacations or permanent residence!",
        options: [
            { label: "📋 View Mombasa listings", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "affordable": {
        text: "Here are some great affordable options 💵:\n\n🏢 **1-2 Bedroom Apartments** in Kilimani/South B — From KES 5M\n🏘️ **Townhouses** in Syokimau/Athi River — From KES 8M\n🌿 **Land** in Konza/Kangundo Road — From KES 1.5M\n\nWe also offer flexible payment plans with select developers!",
        options: [
            { label: "📋 View affordable listings", value: "Show me property listings" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "listings": {
        text: "I'd recommend browsing our Properties page where you can filter by:\n\n✅ Location\n✅ Price range\n✅ Property type\n✅ Number of bedrooms\n✅ Amenities\n\nWould you like me to direct you there?",
        options: [
            { label: "🔗 Go to Properties", value: "go_properties" },
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
    "default": {
        text: "Thanks for your question! 😊 I can help you with:\n\n• Buying or renting properties\n• Property pricing and locations\n• Connecting you with expert agents\n• Understanding our process\n\nFor more specific questions, I'd recommend connecting with one of our agents who can provide personalized assistance.",
        options: [
            { label: "👤 Talk to an agent", value: "I want to talk to an agent" },
            { label: "🔙 Main menu", value: "main_menu" },
        ],
    },
};

function classifyMessage(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes("buy") || lower.includes("purchase") || lower.includes("own")) return "buy";
    if (lower.includes("rent") || lower.includes("lease") || lower.includes("tenant")) return "rent";
    if (lower.includes("price") || lower.includes("cost") || lower.includes("how much") || lower.includes("pricing") || lower.includes("afford")) return "price";
    if (lower.includes("agent") || lower.includes("talk") || lower.includes("human") || lower.includes("customer") || lower.includes("support") || lower.includes("help me") || lower.includes("call") || lower.includes("contact")) return "agent";
    if (lower.includes("process") || lower.includes("how") || lower.includes("work") || lower.includes("step")) return "process";
    if (lower.includes("nairobi") || lower.includes("karen") || lower.includes("westlands") || lower.includes("kilimani") || lower.includes("runda")) return "nairobi";
    if (lower.includes("mombasa") || lower.includes("nyali") || lower.includes("coast")) return "mombasa";
    if (lower.includes("cheap") || lower.includes("affordable") || lower.includes("budget") || lower.includes("low price")) return "affordable";
    if (lower.includes("listing") || lower.includes("browse") || lower.includes("properties") || lower.includes("search") || lower.includes("show")) return "listings";
    if (lower.includes("main menu") || lower.includes("start over") || lower.includes("menu")) return "menu";
    return "default";
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Show greeting after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!hasGreeted) {
                setUnread(1);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [hasGreeted]);

    const openChat = () => {
        setIsOpen(true);
        setUnread(0);
        if (!hasGreeted) {
            setHasGreeted(true);
            const greeting: Message = {
                id: "greeting",
                text: "Hi there! 👋 I'm EstateVue's AI assistant. How can I help you find your dream property today?",
                sender: "bot",
                timestamp: new Date(),
                options: INITIAL_OPTIONS,
            };
            setMessages([greeting]);
        }
    };

    const addBotResponse = (category: string) => {
        setIsTyping(true);
        const delay = 800 + Math.random() * 600;

        setTimeout(() => {
            const response = AI_RESPONSES[category] || AI_RESPONSES["default"];
            const botMsg: Message = {
                id: Date.now().toString(),
                text: response.text,
                sender: "bot",
                timestamp: new Date(),
                options: response.options,
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, delay);
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        const category = classifyMessage(input.trim());
        setInput("");

        if (category === "menu") {
            setIsTyping(true);
            setTimeout(() => {
                const menuMsg: Message = {
                    id: Date.now().toString(),
                    text: "Sure! What would you like to know? 😊",
                    sender: "bot",
                    timestamp: new Date(),
                    options: INITIAL_OPTIONS,
                };
                setMessages((prev) => [...prev, menuMsg]);
                setIsTyping(false);
            }, 500);
            return;
        }

        addBotResponse(category);
    };

    const handleQuickOption = (option: QuickOption) => {
        // Handle action options
        if (option.value === "call_agent") {
            window.open("tel:+254700123456", "_self");
            return;
        }
        if (option.value === "whatsapp_agent") {
            window.open("https://wa.me/254700123456?text=Hi%20EstateVue%2C%20I%20need%20help%20finding%20a%20property", "_blank");
            return;
        }
        if (option.value === "view_agents") {
            window.location.href = "/agents";
            return;
        }
        if (option.value === "go_properties") {
            window.location.href = "/properties";
            return;
        }
        if (option.value === "main_menu") {
            const userMsg: Message = {
                id: Date.now().toString(),
                text: "Main menu",
                sender: "user",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setIsTyping(true);
            setTimeout(() => {
                const menuMsg: Message = {
                    id: Date.now().toString(),
                    text: "Sure! What would you like to know? 😊",
                    sender: "bot",
                    timestamp: new Date(),
                    options: INITIAL_OPTIONS,
                };
                setMessages((prev) => [...prev, menuMsg]);
                setIsTyping(false);
            }, 500);
            return;
        }

        // Regular text options
        const userMsg: Message = {
            id: Date.now().toString(),
            text: option.label.replace(/^[\p{Emoji}\s]+/u, "").trim() || option.value,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        const category = classifyMessage(option.value);
        addBotResponse(category);
    };

    return (
        <>
            {/* Chat Widget */}
            <div className={`${styles.chatWidget} ${isOpen ? styles.chatOpen : ""}`}>
                {/* Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.botAvatar}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8V4H8" /><rect x="2" y="8" width="20" height="12" rx="2" /><path d="M6 12h.01M10 12h.01" /><path d="M14 12h.01M18 12h.01" /><path d="M9 16s.9 1 3 1 3-1 3-1" /></svg>
                            <span className={styles.onlineDot} />
                        </div>
                        <div>
                            <h4 className={styles.headerTitle}>EstateVue AI</h4>
                            <span className={styles.headerStatus}>Online • Replies instantly</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close chat">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Messages */}
                <div className={styles.chatMessages}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`${styles.message} ${msg.sender === "user" ? styles.userMsg : styles.botMsg}`}>
                            {msg.sender === "bot" && (
                                <div className={styles.msgAvatar}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="8" width="20" height="12" rx="2" /><path d="M9 16s.9 1 3 1 3-1 3-1" /><circle cx="8" cy="13" r="1" /><circle cx="16" cy="13" r="1" /></svg>
                                </div>
                            )}
                            <div className={styles.msgContent}>
                                <div className={styles.msgBubble}>
                                    {msg.text.split("\n").map((line, i) => (
                                        <span key={i}>
                                            {line.replace(/\*\*(.*?)\*\*/g, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                                            {i < msg.text.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                                {msg.options && (
                                    <div className={styles.quickOptions}>
                                        {msg.options.map((opt) => (
                                            <button
                                                key={opt.value}
                                                className={styles.quickOption}
                                                onClick={() => handleQuickOption(opt)}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <span className={styles.msgTime}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className={`${styles.message} ${styles.botMsg}`}>
                            <div className={styles.msgAvatar}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="8" width="20" height="12" rx="2" /><circle cx="8" cy="13" r="1" /><circle cx="16" cy="13" r="1" /></svg>
                            </div>
                            <div className={styles.typingIndicator}>
                                <span /><span /><span />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={styles.chatInput}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className={styles.inputField}
                    />
                    <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()} aria-label="Send message">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                </div>

                {/* Powered By */}
                <div className={styles.poweredBy}>
                    Powered by <strong>EstateVue AI</strong> • <button className={styles.handoverBtn} onClick={() => handleQuickOption({ label: "Talk to agent", value: "I want to talk to an agent" })}>Talk to a human</button>
                </div>
            </div>

            {/* Floating Button */}
            {!isOpen && (
                <button className={styles.floatingBtn} onClick={openChat} aria-label="Open chat">
                    <div className={styles.floatingIcon}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                    <span className={styles.floatingLabel}>Chat with us</span>
                </button>
            )}
        </>
    );
}
