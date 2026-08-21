import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatBot from "@/components/chat/ChatBot";
import BackToTop from "@/components/ui/BackToTop";
import CookieConsent from "@/components/ui/CookieConsent";
import ToastProvider from "@/components/ui/ToastProvider";
import { Providers } from "./providers";
import { PWAProvider } from "@/components/pwa/PWAInstall";

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

const BASE_URL = "https://realestate-app-three-theta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "EstateVue — Find Your Dream Home in Kenya",
    template: "%s",
  },
  description:
    "Discover luxury properties, modern homes, and prime real estate across Kenya. Browse thousands of listings, connect with top agents, and find your perfect home with EstateVue.",
  keywords: "real estate Kenya, homes for sale, apartments, luxury properties, buy house, rent apartment, Nairobi, Mombasa, property listing",
  authors: [{ name: "EstateVue" }],
  creator: "EstateVue",
  publisher: "EstateVue",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    title: "EstateVue — Find Your Dream Home in Kenya",
    description: "Discover luxury properties and find your perfect home across Kenya.",
    url: BASE_URL,
    siteName: "EstateVue",
    type: "website",
    locale: "en_KE",
    images: [
      {
        url: `${BASE_URL}/images/hero-bg.png`,
        width: 1200,
        height: 630,
        alt: "EstateVue — Premium Real Estate Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EstateVue — Find Your Dream Home in Kenya",
    description: "Discover luxury properties and find your perfect home across Kenya.",
    images: [`${BASE_URL}/images/hero-bg.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-verification-code",
  },
};

// JSON-LD structured data for the organization
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "EstateVue",
  description: "Premium real estate platform connecting buyers with luxury properties across Kenya.",
  url: BASE_URL,
  logo: `${BASE_URL}/images/hero-bg.png`,
  areaServed: {
    "@type": "Country",
    name: "Kenya",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "KE",
    addressLocality: "Nairobi",
  },
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d4a017" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EstateVue" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
          <PWAProvider>
            <ToastProvider />
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ChatBot />
            <CookieConsent />
            <BackToTop />
          </PWAProvider>
        </Providers>
      </body>
    </html>
  );
}
