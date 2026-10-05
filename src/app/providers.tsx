"use client";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CompareProvider } from "@/context/CompareContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import CompareBar from "@/components/compare/CompareBar";
import RecentlyViewedDrawer from "@/components/ui/RecentlyViewedDrawer";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <CurrencyProvider>
                <AuthProvider>
                    <CompareProvider>
                        {children}
                        <CompareBar />
                        <RecentlyViewedDrawer />
                    </CompareProvider>
                </AuthProvider>
            </CurrencyProvider>
        </ThemeProvider>
    );
}
