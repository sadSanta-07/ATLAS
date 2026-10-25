import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = localFont({
  src: "../components/fonts/Poppins-Regular.woff2",
  variable: "--font-poppins",
  display: "swap",
  weight: "400",
});

const instrumentSerif = localFont({
  src: "../components/fonts/InstrumentSerif-Regular.ttf",
  variable: "--font-instrument-serif",
  display: "swap",
  weight: "400",
});

const specialGothic = localFont({
  src: "../components/fonts/SpecialGothicExpandedOne-Regular.woff2",
  variable: "--font-special-gothic",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "ATLAS — Temporal Change Intelligence",
  description:
    "Compare imagery captured at different times. Align scenes, account for lighting, and localize meaningful visual changes with ATLAS.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", poppins.variable, instrumentSerif.variable, specialGothic.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
