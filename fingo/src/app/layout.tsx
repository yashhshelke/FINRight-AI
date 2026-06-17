import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fingo — Your Personal Finance Operating System",
  description:
    "Track spending, manage budgets, monitor cash flow, and receive AI-powered financial guidance. Build long-term financial wellness with Fingo.",
  keywords: ["personal finance", "budgeting", "AI financial advisor", "cash flow", "savings goals"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} dark h-full`}>
      <body className="min-h-full bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
