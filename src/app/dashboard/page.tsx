"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardRedirect() {
    const router = useRouter();
    const { user, userProfile, loading, getDashboardPath } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/auth/signin");
            } else if (userProfile) {
                router.push(getDashboardPath());
            }
        }
    }, [user, userProfile, loading, router, getDashboardPath]);

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "var(--navbar-height)" }}>
            <div style={{ width: 40, height: 40, border: "3px solid var(--border-color)", borderTopColor: "var(--navy-800)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
    );
}
