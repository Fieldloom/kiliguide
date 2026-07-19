"use client";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, Lock, Search, Zap, Building, Sparkles, ShieldCheck, GraduationCap, Plus } from "lucide-react";
import { useState } from "react";

export function WelcomePage() {
  const [hoveredPill, setHoveredPill] = useState<number | null>(null);

  const pills = [
    "Exam timetable", "Hostel application", "Fee structure", "Academic calendar", "Where is Finance Office?"
  ];

  const features = [
    { title: "Verified Answers", desc: "From Official Sources", icon: ShieldCheck },
    { title: "24/7 Assistance", desc: "Always Available", icon: Zap },
    { title: "Secure & Private", desc: "Your Data is Safe", icon: Lock },
    { title: "Built for Students", desc: "Designed for Success", icon: GraduationCap }
  ];

  return (
    <main className="ambient-bg" style={{ minHeight: "100vh", color: "#ffffff", overflow: "hidden", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      
      {/* Huge Background Glow */}
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "100vw", height: "100vw", background: "radial-gradient(circle, rgba(25,195,125,0.06) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "80vw", height: "80vw", background: "radial-gradient(circle, rgba(25,195,125,0.04) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        
        {/* Navbar */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#0B0F14", display: "grid", placeItems: "center", border: "1px solid #1A2A20" }}>
              <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
            </span>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>KiliGuide</h1>
              <span style={{ fontSize: 11, color: "#a1a1aa" }}>Smarter Campus. Better Tomorrow.</span>
            </div>
          </div>

          <nav style={{ display: "none", gap: 24, fontSize: 13, fontWeight: 600, color: "#ececec" }} className="lg-flex">
            <span style={{ color: "#19c37d", borderBottom: "2px solid #19c37d", paddingBottom: 26, transform: "translateY(14px)" }}>Home</span>
            <span>Chats</span>
            <span>Documents</span>
            <span>Timetable</span>
            <span>Notices</span>
            <span>My Services</span>
            <span>Support</span>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "8px 16px", color: "#ececec", fontSize: 13, fontWeight: 600 }} className="hidden sm-flex">
              <Sparkles size={14} style={{ color: "#19c37d" }} /> Ask KiliGuide
            </button>
            <Link href="/login" style={{ background: "#19c37d", color: "#000", border: "none", borderRadius: 20, padding: "8px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#14a367"} onMouseLeave={e => e.currentTarget.style.background = "#19c37d"}>
              Sign In <ArrowRight size={14} />
            </Link>
          </div>
        </header>

        {/* Hero Area */}
        <section style={{ display: "flex", flexWrap: "wrap", alignItems: "center", marginTop: 80, gap: 60 }}>
          
          {/* Left Content */}
          <div style={{ flex: "1 1 500px", zIndex: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(25, 195, 125, 0.05)", border: "1px solid rgba(25, 195, 125, 0.2)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#ececec", marginBottom: 32 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#19c37d", boxShadow: "0 0 8px #19c37d" }} />
              Official Campus Companion
            </div>

            <h2 style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 24 }}>
              Everything You Need.<br />
              <span style={{ color: "#19c37d" }}>Powered by AI.</span>
            </h2>

            <p style={{ fontSize: "clamp(16px, 2vw, 18px)", color: "#a1a1aa", lineHeight: 1.6, maxWidth: 540, marginBottom: 40 }}>
              KiliGuide makes campus life easier by giving you instant, accurate answers from official university information—anytime, anywhere.
            </p>

            {/* Fake Search */}
            <div style={{ background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 100, display: "flex", alignItems: "center", padding: "8px 8px 8px 24px", maxWidth: 600, marginBottom: 24, boxShadow: "0 8px 32px rgba(25, 195, 125, 0.05)" }}>
              <Search size={20} style={{ color: "#a1a1aa", marginRight: 16 }} />
              <input readOnly placeholder="Ask anything about DeKUT..." style={{ flex: 1, background: "transparent", border: "none", color: "#ececec", fontSize: 16, outline: "none", cursor: "default" }} />
              <button style={{ width: 44, height: 44, borderRadius: "50%", background: "#19c37d", border: "none", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <ArrowRight size={20} style={{ color: "#000" }} />
              </button>
            </div>

            {/* Try Asking Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 60 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#ececec" }}>Try asking:</span>
              {pills.map((pill, i) => (
                <div key={i} onMouseEnter={() => setHoveredPill(i)} onMouseLeave={() => setHoveredPill(null)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${hoveredPill === i ? "#19c37d" : "#1A2A20"}`, background: hoveredPill === i ? "rgba(25, 195, 125, 0.1)" : "transparent", color: hoveredPill === i ? "#19c37d" : "#8e8ea0", fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}>
                  {pill}
                </div>
              ))}
            </div>

            {/* Features Row */}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <f.icon size={24} style={{ color: "#19c37d" }} />
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: "#ececec", marginBottom: 2 }}>{f.title}</h4>
                    <span style={{ fontSize: 12, color: "#8e8ea0" }}>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Content - Dashboard Preview Mockup */}
          <div style={{ flex: "1 1 500px", display: "flex", justifyContent: "flex-end", perspective: 1000, zIndex: 10 }} className="hidden lg-flex">
            <div style={{ 
              width: "110%", minWidth: 600, height: 480, background: "#06080A", border: "1px solid #1A2A20", 
              borderRadius: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(25, 195, 125, 0.2), inset 0 0 40px rgba(25, 195, 125, 0.02)", 
              transform: "rotateY(-15deg) rotateX(5deg) translateZ(0)", transformStyle: "preserve-3d",
              display: "flex", overflow: "hidden"
            }}>
              {/* Mock Sidebar */}
              <div style={{ width: 220, background: "#0B0F14", borderRight: "1px solid #131820", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
                  <div style={{ width: 24, height: 24, background: "#19c37d", borderRadius: 6 }} />
                  <div style={{ height: 12, width: 80, background: "#1A2A20", borderRadius: 4 }} />
                </div>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                    <div style={{ width: 16, height: 16, background: i === 1 ? "#19c37d" : "#1A2A20", borderRadius: 4 }} />
                    <div style={{ height: 8, width: i % 2 === 0 ? 60 : 80, background: i === 1 ? "#ececec" : "#1A2A20", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
              {/* Mock Main Area */}
              <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>Good morning, Student <span style={{ fontSize: 20 }}>👋</span></h3>
                <p style={{ color: "#8e8ea0", fontSize: 14, marginBottom: 24 }}>How can I help you today?</p>
                <div style={{ height: 48, background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 24, marginBottom: 32, display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between" }}>
                  <div style={{ height: 8, width: 140, background: "#1A2A20", borderRadius: 4 }} />
                  <div style={{ width: 24, height: 24, background: "#19c37d", borderRadius: "50%" }} />
                </div>
                <b style={{ fontSize: 12, color: "#8e8ea0", marginBottom: 16 }}>Quick Access</b>
                <div style={{ display: "flex", gap: 12 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 80, background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                       <div style={{ width: 24, height: 24, background: "rgba(25, 195, 125, 0.1)", borderRadius: 6 }} />
                       <div style={{ height: 4, width: 40, background: "#1A2A20", borderRadius: 2 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section style={{ marginTop: 100, paddingBottom: 60, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, borderRight: "1px solid #131820", paddingRight: 40 }}>
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Dedan_Kimathi_University_of_Technology_logo.png/220px-Dedan_Kimathi_University_of_Technology_logo.png" alt="DeKUT" style={{ width: 48, height: 48, objectFit: "contain", background: "#fff", borderRadius: "50%", padding: 4 }} />
            <div>
              <span style={{ fontSize: 12, color: "#8e8ea0", display: "block", marginBottom: 2 }}>Trusted by Universities</span>
              <b style={{ fontSize: 14, color: "#ececec" }}>Dedan Kimathi University of<br/>Technology</b>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, borderRight: "1px solid #131820", paddingRight: 40 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid #1A2A20", display: "grid", placeItems: "center" }}>
              <Plus size={16} style={{ color: "#a1a1aa" }} />
            </div>
            <span style={{ fontSize: 13, color: "#8e8ea0" }}>More universities<br/>coming soon</span>
          </div>

          <div style={{ display: "flex", gap: 40, flex: 1, justifyContent: "space-between" }}>
            <div>
              <b style={{ fontSize: 24, fontWeight: 800, color: "#19c37d", display: "block", marginBottom: 4 }}>15,000+</b>
              <span style={{ fontSize: 13, color: "#8e8ea0" }}>Students Helped</span>
            </div>
            <div>
              <b style={{ fontSize: 24, fontWeight: 800, color: "#19c37d", display: "block", marginBottom: 4 }}>98%</b>
              <span style={{ fontSize: 13, color: "#8e8ea0" }}>Answer Accuracy</span>
            </div>
            <div>
              <b style={{ fontSize: 24, fontWeight: 800, color: "#19c37d", display: "block", marginBottom: 4 }}>24/7</b>
              <span style={{ fontSize: 13, color: "#8e8ea0" }}>Always Available</span>
            </div>
            <div>
              <b style={{ fontSize: 24, fontWeight: 800, color: "#19c37d", display: "block", marginBottom: 4 }}>12+</b>
              <span style={{ fontSize: 13, color: "#8e8ea0" }}>Services & Features</span>
            </div>
          </div>
        </section>

      </div>

      <style>{`
        body { background: #000000 !important; }
        @media (min-width: 1024px) { .lg-flex { display: flex !important; } }
        @media (min-width: 640px) { .sm-flex { display: flex !important; } }
      `}</style>
    </main>
  );
}
