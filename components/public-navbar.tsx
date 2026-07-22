"use client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export function PublicNavbar() {
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

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
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit", zIndex: 10 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: "#0B0F14", display: "grid", placeItems: "center", border: "1px solid #1A2A20" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
        </span>
        <div className="hidden sm-block">
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>KiliGuide</h1>
          <span style={{ fontSize: 11, color: "#a1a1aa" }}>Smarter Campus.</span>
        </div>
      </Link>

      {/* Apple Vision Pro Style Floating Tab Bar */}
      <nav 
        onMouseLeave={() => setHoveredTab(null)}
        style={{ 
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          display: "none", alignItems: "center", gap: 4, 
          background: "rgba(255,255,255,0.03)", backdropFilter: "blur(24px)", 
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, 
          padding: "6px", boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.02)" 
        }} 
        className="lg-flex"
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

      {/* Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 10 }}>
        <Link href="/register-institution" style={{ background: "rgba(25,195,125,0.1)", border: "1px solid rgba(25,195,125,0.3)", borderRadius: 100, padding: "8px 16px", color: "#19c37d", fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(25,195,125,0.2)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(25,195,125,0.1)"; }} className="hidden sm-flex">
          Register Institution
        </Link>
        <Link href="/login" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, padding: "8px 16px", color: "#ececec", fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }} className="hidden sm-flex">
          App Workspaces
        </Link>
        <Link href="/login" style={{ background: "#ffffff", color: "#000", border: "none", borderRadius: 100, padding: "8px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "transform 0.2s, opacity 0.2s", boxShadow: "0 4px 14px rgba(255,255,255,0.2)" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.opacity = "0.9"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}>
          Sign In <ArrowRight size={14} />
        </Link>
      </div>

      <style>{`
        @media (min-width: 1024px) { .lg-flex { display: flex !important; } }
        @media (min-width: 640px) { .sm-flex { display: flex !important; } .sm-block { display: block !important; } }
        .hidden { display: none; }
      `}</style>
    </header>
  );
}
