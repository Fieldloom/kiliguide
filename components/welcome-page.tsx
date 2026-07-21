"use client";
import Link from "next/link";
import { ArrowRight, Lock, Search, Zap, Sparkles, ShieldCheck, GraduationCap, Plus, CalendarDays, BookOpenCheck } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PublicNavbar } from "./public-navbar";
import { PublicFooter } from "./public-footer";

export function HeroContent() {
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
        <input placeholder="Ask anything about DeKUT..." style={{ flex: 1, background: "transparent", border: "none", color: "#ececec", fontSize: 16, outline: "none" }} />
        <Link href="/login" style={{ width: 44, height: 44, borderRadius: "50%", background: "#19c37d", border: "none", display: "grid", placeItems: "center", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          <ArrowRight size={20} style={{ color: "#000" }} />
        </Link>
      </div>

      {/* Try Asking Pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 60 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#ececec" }}>Try asking:</span>
        {pills.map((pill, i) => (
          <Link href="/login" key={i} onMouseEnter={() => setHoveredPill(i)} onMouseLeave={() => setHoveredPill(null)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${hoveredPill === i ? "#19c37d" : "#1A2A20"}`, background: hoveredPill === i ? "rgba(25, 195, 125, 0.1)" : "transparent", color: hoveredPill === i ? "#19c37d" : "#8e8ea0", fontSize: 12, cursor: "pointer", transition: "all 0.2s", textDecoration: "none" }}>
            {pill}
          </Link>
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
  );
}

export function DashboardMockup() {
  return (
    <div style={{ flex: "1 1 500px", display: "flex", justifyContent: "flex-end", perspective: 1000, zIndex: 10 }} className="hidden lg-flex">
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        style={{ 
          width: "110%", minWidth: 600, height: 480, 
          background: "rgba(11, 15, 20, 0.6)", backdropFilter: "blur(40px)", 
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, 
          boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,255,255,0.03), 0 0 0 1px rgba(25, 195, 125, 0.1)", 
          transform: "rotateY(-15deg) rotateX(5deg) translateZ(0)", transformStyle: "preserve-3d",
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}
      >
        {/* macOS Window Header */}
        <div style={{ height: 40, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", padding: "0 16px", gap: 8, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
          <div style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8e8ea0", marginRight: 56 }}>app.kiliguide.com</div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Mock Sidebar */}
          <div style={{ width: 220, background: "rgba(0,0,0,0.2)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <div style={{ width: 24, height: 24, background: "#19c37d", borderRadius: 6, boxShadow: "0 2px 10px rgba(25,195,125,0.4)" }} />
              <div style={{ height: 12, width: 80, background: "rgba(255,255,255,0.1)", borderRadius: 4 }} />
            </div>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <div style={{ width: 16, height: 16, background: i === 1 ? "#19c37d" : "rgba(255,255,255,0.05)", borderRadius: 4 }} />
                <div style={{ height: 8, width: i % 2 === 0 ? 60 : 80, background: i === 1 ? "#ececec" : "rgba(255,255,255,0.1)", borderRadius: 4 }} />
              </div>
            ))}
          </div>
          
          {/* Mock Main Area */}
          <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>Good morning, Griffin <span style={{ fontSize: 20 }}>👋</span></h3>
            <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 24 }}>How can I help you navigate DeKUT today?</p>
            
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px", marginBottom: 32, display: "flex", flexDirection: "column", gap: 12, boxShadow: "inset 0 0 20px rgba(255,255,255,0.01)" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "rgba(25, 195, 125, 0.2)", backdropFilter: "blur(10px)", color: "#ececec", padding: "10px 14px", borderRadius: 16, borderBottomRightRadius: 4, fontSize: 13, border: "1px solid rgba(25, 195, 125, 0.3)" }}>
                  When is the next academic trip for BSc Computer Science?
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 28, height: 28, background: "#19c37d", borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(25, 195, 125, 0.3)" }}>
                  <Sparkles size={14} color="#000" />
                </div>
                <div style={{ background: "transparent", color: "#ececec", fontSize: 13, lineHeight: 1.5 }}>
                  According to the latest <b style={{ color: "#fff" }}>Department of Computer Science Notice</b>, the academic trip to Safaricom Headquarters is scheduled for <b style={{ color: "#fff" }}>Friday, November 12th</b>. Please ensure your fee balance is cleared before registering.
                </div>
              </div>
            </div>

            <b style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 16 }}>Quick Features</b>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { title: "My Timetable", icon: CalendarDays },
                { title: "Latest Notices", icon: ShieldCheck },
                { title: "Student Support", icon: Zap },
                { title: "Campus Rules", icon: BookOpenCheck },
              ].map((feature, i) => (
                <div key={i} style={{ flex: 1, height: 80, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
                   <div style={{ width: 28, height: 28, background: "rgba(25, 195, 125, 0.15)", borderRadius: 8, display: "grid", placeItems: "center", border: "1px solid rgba(25, 195, 125, 0.2)" }}>
                     <feature.icon size={14} style={{ color: "#19c37d" }} />
                   </div>
                   <div style={{ fontSize: 10, color: "#a1a1aa", fontWeight: 600, textAlign: "center" }}>{feature.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function TrustedBy() {
  return (
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
  );
}

export function WelcomePage() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", overflow: "hidden", position: "relative" }}>
      
      {/* Huge Background Glow */}
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "100vw", height: "100vw", background: "radial-gradient(circle, rgba(25,195,125,0.06) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "80vw", height: "80vw", background: "radial-gradient(circle, rgba(25,195,125,0.04) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <PublicNavbar />
        
        <section style={{ display: "flex", flexWrap: "wrap", alignItems: "center", marginTop: 80, gap: 60 }}>
          <HeroContent />
          <DashboardMockup />
        </section>

        <TrustedBy />

        <PublicFooter />
      </div>

      <style>{`
        body { background: #000000 !important; }
        @media (min-width: 1024px) { .lg-flex { display: flex !important; } }
        @media (min-width: 640px) { .sm-flex { display: flex !important; } }
      `}</style>
    </main>
  );
}
