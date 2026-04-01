import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Actify — Convert Any Content Into Action",
  description:
    "Paste a YouTube video or article. Actify extracts summaries, key insights, action plans and lets you ask AI questions. Stop consuming. Start acting.",
  openGraph: {
    title: "Actify — Convert Any Content Into Action",
    description:
      "Don't consume content. Extract value and act. Paste any YouTube URL and get summaries, insights, action plans, and AI Q&A in minutes.",
    siteName: "Actify",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Actify — Convert Any Content Into Action",
    description: "Don't consume content. Extract value and act.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <NavBar />
        <main className="flex flex-col min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
