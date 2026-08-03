import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatBot from "@/components/chat/ChatBot";
import BackToTop from "@/components/ui/BackToTop";
import ToastProvider from "@/components/ui/ToastProvider";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EstateVue — Find Your Dream Home",
  description:
    "Discover luxury properties, modern homes, and prime real estate. Browse thousands of listings, connect with top agents, and find your perfect home with EstateVue.",
  keywords: "real estate, homes for sale, apartments, luxury properties, buy house, rent apartment",
  openGraph: {
    title: "EstateVue — Find Your Dream Home",
    description: "Discover luxury properties and find your perfect home.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          <ToastProvider />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ChatBot />
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
