"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
} from "firebase/auth";
import { auth, googleProvider, isConfigured } from "@/lib/firebase";
import { createUserProfile, getUserProfile, UserProfile } from "@/lib/firestore";

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    isFirebaseReady: boolean;
    signIn: (email: string, password: string) => Promise<UserProfile | null>;
    signUp: (email: string, password: string, fullName: string, phone?: string, role?: "buyer" | "agent", agentData?: {
        agency?: string;
        specialization?: string;
        experience?: string;
        license?: string;
        location?: string;
    }) => Promise<UserProfile | null>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
    getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from Firestore
    const fetchProfile = async (uid: string) => {
        if (!isConfigured) return null;
        try {
            const profile = await getUserProfile(uid);
            setUserProfile(profile);
            return profile;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    };

    useEffect(() => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchProfile(currentUser.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getDashboardPath = (): string => {
        if (!userProfile) return "/";
        switch (userProfile.role) {
            case "admin":
                return "/dashboard/admin";
            case "agent":
                return "/dashboard/agent";
            case "buyer":
            default:
                return "/dashboard/buyer";
        }
    };

    const signIn = async (email: string, password: string): Promise<UserProfile | null> => {
        if (!isConfigured) throw new Error("Firebase is not configured. Please add your credentials to .env.local");
        const result = await signInWithEmailAndPassword(auth, email, password);
        const profile = await fetchProfile(result.user.uid);
        return profile || null;
    };

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        phone?: string,
        role?: "buyer" | "agent",
        agentData?: {
            agency?: string;
            specialization?: string;
            experience?: string;
            license?: string;
            location?: string;
        }
    ): Promise<UserProfile | null> => {
        if (!isConfigured) throw new Error("Firebase is not configured. Please add your credentials to .env.local");
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: fullName });
        await createUserProfile(result.user.uid, {
            email,
            displayName: fullName,
            phone,
            avatar: result.user.photoURL || "",
            role: role || "buyer",
            ...(agentData || {}),
        });
        const profile = await fetchProfile(result.user.uid);
        return profile || null;
    };

    const signInWithGoogle = async () => {
        if (!isConfigured) throw new Error("Firebase is not configured. Please add your credentials to .env.local");
        const result = await signInWithPopup(auth, googleProvider);
        const existing = await getUserProfile(result.user.uid);
        if (!existing) {
            await createUserProfile(result.user.uid, {
                email: result.user.email || "",
                displayName: result.user.displayName || "",
                avatar: result.user.photoURL || "",
            });
        }
        await fetchProfile(result.user.uid);
    };

    const logout = async () => {
        if (!isConfigured) return;
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    const resetPassword = async (email: string) => {
        if (!isConfigured) throw new Error("Firebase is not configured. Please add your credentials to .env.local");
        await sendPasswordResetEmail(auth, email);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                isFirebaseReady: !!isConfigured,
                signIn,
                signUp,
                signInWithGoogle,
                logout,
                resetPassword,
                refreshProfile,
                getDashboardPath,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
