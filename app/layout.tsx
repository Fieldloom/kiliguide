import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaRegistration } from "../components/pwa-registration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KiliGuide | The AI Operating System for Universities",
  description:
    "KiliGuide is an AI-powered operating system for universities — source-grounded answers from official university information, built for students.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#06080a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
