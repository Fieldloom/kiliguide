"use client";

import { motion } from "framer-motion";
import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";
import { Users, GraduationCap, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ececec", position: "relative" }}>
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "100vw", height: "100vw", background: "radial-gradient(circle, rgba(25,195,125,0.06) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />
      
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <PublicNavbar />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: 800, margin: "80px auto", padding: "40px 0" }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(25, 195, 125, 0.1)", border: "1px solid rgba(25, 195, 125, 0.2)", borderRadius: 100, padding: "8px 20px", marginBottom: 32 }}>
            <Users size={14} color="#19c37d" />
            <span style={{ color: "#19c37d", fontSize: 13, fontWeight: 600 }}>Who we are</span>
          </div>
          
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 24px", lineHeight: 1.1 }}>
            Built by <span style={{ color: "#19c37d" }}>KiliMind AI</span>. <br/> Designed for Students.
          </h1>
          <p style={{ fontSize: 18, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 48 }}>
            KiliGuide is more than just a software platform; it is a vision for the future of higher education in Africa. Developed entirely by KiliMind AI, we are committed to solving the friction between students and complex university bureaucracies through cutting-edge Artificial Intelligence.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 32, boxShadow: "inset 0 0 40px rgba(255,255,255,0.01)" }}>
              <div style={{ width: 48, height: 48, background: "rgba(25, 195, 125, 0.1)", borderRadius: 16, display: "grid", placeItems: "center", marginBottom: 20 }}>
                <GraduationCap size={24} color="#19c37d" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "#fff" }}>Our Mission at DeKUT</h2>
              <p style={{ fontSize: 15, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
                We built KiliGuide with Dedan Kimathi University of Technology (DeKUT) in mind. Our goal is to transform the campus experience—giving students instant access to timetables, transparent fee structures, and immediate support, all without ever needing to stand in a queue.
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 32, boxShadow: "inset 0 0 40px rgba(255,255,255,0.01)" }}>
              <div style={{ width: 48, height: 48, background: "rgba(138, 43, 226, 0.1)", borderRadius: 16, display: "grid", placeItems: "center", marginBottom: 20 }}>
                <Sparkles size={24} color="#8a2be2" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "#fff" }}>The Future of KiliMind AI</h2>
              <p style={{ fontSize: 15, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
                As an AI research and product lab, KiliMind AI is continuously pushing the boundaries of what is possible on edge devices and encrypted architectures. We believe privacy and power are not mutually exclusive. KiliGuide is simply the beginning.
              </p>
            </div>
          </div>

        </motion.div>
        
        <PublicFooter />
      </div>
    </main>
  );
}
