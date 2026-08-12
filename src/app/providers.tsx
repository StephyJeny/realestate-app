"use client";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CompareProvider } from "@/context/CompareContext";
import CompareBar from "@/components/compare/CompareBar";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CompareProvider>
                    {children}
                    <CompareBar />
                </CompareProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
