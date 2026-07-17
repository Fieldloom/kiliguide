import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistration } from "../components/pwa-registration";
export const metadata: Metadata = { title:"KiliGuide | DeKUT smart campus guide", description:"Trusted Dedan Kimathi University of Technology answers by KiliMind AI", manifest:"/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#102a5d" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><PwaRegistration/>{children}</body></html> }
