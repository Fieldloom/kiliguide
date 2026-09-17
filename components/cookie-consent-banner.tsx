"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("kiliguide_cookie_consent");
    if (!consent) {
      // Delay slightly for smooth entrance animation
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (choice: "accepted" | "essential") => {
    localStorage.setItem("kiliguide_cookie_consent", choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.03)] rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cookie className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold tracking-tight">We value your privacy</h3>
          </div>
          <button
            onClick={() => handleConsent("essential")}
            className="text-zinc-400 hover:text-white p-1 transition-colors rounded-lg hover:bg-white/5"
            aria-label="Close cookie banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
          KiliGuide uses essential cookies and local storage to keep you authenticated, store your theme preferences, and deliver seamless AI guidance for DeKUT students. Learn more in our{" "}
          <Link href="/cookies" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            Cookie Policy
          </Link>.
        </p>

        <div className="flex items-center gap-2.5 justify-end">
          <button
            onClick={() => handleConsent("essential")}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            Essential Only
          </button>
          <button
            onClick={() => handleConsent("accepted")}
            className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
