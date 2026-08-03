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
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from Firestore
    const fetchProfile = async (uid: string) => {
        if (!isConfigured) return;
        try {
            const profile = await getUserProfile(uid);
            setUserProfile(profile);
        } catch {
            console.error("Error fetching user profile");
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

    const signIn = async (email: string, password: string) => {
        if (!isConfigured) throw new Error("Firebase is not configured. Please add your credentials to .env.local");
        const result = await signInWithEmailAndPassword(auth, email, password);
        await fetchProfile(result.user.uid);
    };

    const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
        if (!isConfigured) throw new Error("Firebase is not configured. Please add your credentials to .env.local");
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: fullName });
        await createUserProfile(result.user.uid, {
            email,
            displayName: fullName,
            phone,
            avatar: result.user.photoURL || "",
        });
        await fetchProfile(result.user.uid);
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
