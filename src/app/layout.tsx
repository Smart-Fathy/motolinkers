import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MotoLinkers — Transparency is the new luxury.",
    template: "%s",
  },
  description:
    "Egypt's EV import consultancy. Factory-direct from China & the UAE to Alexandria. Data-driven, transparent, quietly luxurious.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://motolinkers.com",
  ),
  openGraph: {
    type: "website",
    locale: "en_EG",
    siteName: "MotoLinkers",
  },
  twitter: { card: "summary_large_image" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MotoLinkers",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://motolinkers.com",
  email: "info@motolinkers.com",
  telephone: "+20 100 007 8104",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cairo",
    addressCountry: "EG",
  },
  description:
    "Egypt-based automotive supply-chain consultancy. EV and hybrid imports from China and the UAE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}
