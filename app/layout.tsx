import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistration } from "../components/pwa-registration";
import { CookieConsentBanner } from "../components/cookie-consent-banner";

export const metadata: Metadata = { title:"KiliGuide | Smart Campus Guide", description:"Trusted campus answers powered by KiliMind AI", manifest:"/manifest.webmanifest" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, themeColor: "#000000" };
export default function RootLayout({children}:{children:React.ReactNode}) { 
  return (
    <html lang="en">
      <body>
        <PwaRegistration/>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
