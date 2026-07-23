"use client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { InstallButton } from "./install-button";

export function PublicNavbar() {
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { label: "Home", href: "/" },
    { label: "Vision", href: "/vision" },
    { label: "Technology", href: "/technology" },
    { label: "About", href: "/about" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ];

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 100, padding: "0 24px", position: "relative", zIndex: 100 }}>
      
      {/* Logo */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", minWidth: 0 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit", zIndex: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "#0B0F14", display: "grid", placeItems: "center", border: "1px solid #1A2A20", flexShrink: 0 }}>
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
          </span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>KiliGuide</h1>
            <span style={{ fontSize: 11, color: "#a1a1aa" }}>Smarter Campus.</span>
          </div>
        </Link>
      </div>

      {/* Apple Vision Pro Style Floating Tab Bar */}
      <div className="lg-flex" style={{ display: "none", flex: "0 0 auto", justifyContent: "center", zIndex: 20 }}>
        <nav 
          onMouseLeave={() => setHoveredTab(null)}
          style={{ 
            display: "flex", alignItems: "center", gap: 4, 
            background: "rgba(255,255,255,0.03)", backdropFilter: "blur(24px)", 
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, 
            padding: "6px", boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.02)" 
          }} 
        >
        {tabs.map(item => {
          const isActive = pathname === item.href;
          const isHovered = hoveredTab === item.href;
          
          return (
            <Link 
              key={item.href}
              href={item.href} 
              onMouseEnter={() => setHoveredTab(item.href)}
              style={{ 
                position: "relative", padding: "8px 20px", fontSize: 13, fontWeight: 600, 
                color: isActive ? "#000" : (isHovered ? "#fff" : "#a1a1aa"),
                textDecoration: "none", transition: "color 0.3s ease", zIndex: 1
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ position: "absolute", inset: 0, background: "#19c37d", borderRadius: 100, zIndex: -1, boxShadow: "0 4px 12px rgba(25, 195, 125, 0.3)" }}
                />
              )}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="hover-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.08)", borderRadius: 100, zIndex: -1 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 10 }}>{item.label}</span>
            </Link>
          );
        })}
        </nav>
      </div>

      {/* Action Buttons */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, zIndex: 10, minWidth: 0 }}>
        <InstallButton className="hidden sm-flex" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 100, padding: "8px 16px", color: "#10b981", fontSize: 13, fontWeight: 600 }} />
        <button 
          className="lg-hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ 
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: 100, padding: "8px 16px", color: "#ececec", fontSize: 13, fontWeight: 600, 
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer" 
          }}
        >
          Explore
          <motion.div animate={{ rotate: mobileMenuOpen ? 180 : 0 }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </button>
        <Link href="/login" className="hidden sm-flex" style={{ background: "#ffffff", color: "#000", border: "none", borderRadius: 100, padding: "8px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "transform 0.2s, opacity 0.2s", boxShadow: "0 4px 14px rgba(255,255,255,0.2)" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.opacity = "0.9"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}>
          Sign In <ArrowRight size={14} />
        </Link>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute", top: 80, left: 24, right: 24,
            background: "rgba(10, 15, 20, 0.95)", backdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
            padding: 8, display: "flex", flexDirection: "column", gap: 4,
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)", zIndex: 90
          }}
          className="lg-hidden"
        >
          {tabs.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} style={{ padding: "12px 16px", color: "#ececec", textDecoration: "none", fontSize: 14, fontWeight: 500, borderRadius: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              {item.label}
            </Link>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
          <InstallButton style={{ padding: "12px 16px", color: "#10b981", fontSize: 14, fontWeight: 600, borderRadius: 8, transition: "background 0.2s" }} />
          <Link href="/register-institution" onClick={() => setMobileMenuOpen(false)} style={{ padding: "12px 16px", color: "#19c37d", textDecoration: "none", fontSize: 14, fontWeight: 600, borderRadius: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(25,195,125,0.1)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            Register Institution
          </Link>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ background: "#ffffff", color: "#000", padding: "12px 16px", textDecoration: "none", fontSize: 14, fontWeight: 700, borderRadius: 8, display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
            Sign In <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}

      <style>{`
        @media (min-width: 1024px) { .lg-flex { display: flex !important; } .lg-hidden { display: none !important; } }
        @media (min-width: 640px) { .sm-flex { display: flex !important; } .sm-block { display: block !important; } }
        .hidden { display: none; }
      `}</style>
    </header>
  );
}
