"use client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: "#0B0F14", display: "grid", placeItems: "center", border: "1px solid #1A2A20" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
        </span>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>KiliGuide</h1>
          <span style={{ fontSize: 11, color: "#a1a1aa" }}>Smarter Campus. Better Tomorrow.</span>
        </div>
      </Link>

      <nav style={{ display: "none", gap: 32, fontSize: 13, fontWeight: 600, color: "#ececec" }} className="lg-flex">
        {[
          { label: "Home", href: "/" },
          { label: "Vision", href: "/vision" },
          { label: "Technology", href: "/technology" },
          { label: "Chats", href: "/login" },
          { label: "Timetable", href: "/login" },
          { label: "Notices", href: "/login" },
        ].map(item => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              style={{ 
                color: isActive ? "#19c37d" : "#a1a1aa", 
                borderBottom: isActive ? "2px solid #19c37d" : "2px solid transparent", 
                paddingBottom: 26, 
                transform: "translateY(14px)", 
                textDecoration: "none",
                transition: "color 0.2s" 
              }}
              onMouseEnter={e => !isActive && (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => !isActive && (e.currentTarget.style.color = "#a1a1aa")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/login" style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "8px 16px", color: "#ececec", fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(25, 195, 125, 0.4)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }} className="hidden sm-flex">
          <Sparkles size={14} style={{ color: "#19c37d" }} /> Ask KiliGuide
        </Link>
        <Link href="/login" style={{ background: "#19c37d", color: "#000", border: "none", borderRadius: 20, padding: "8px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#14a367"} onMouseLeave={e => e.currentTarget.style.background = "#19c37d"}>
          Sign In <ArrowRight size={14} />
        </Link>
      </div>
    </header>
  );
}
