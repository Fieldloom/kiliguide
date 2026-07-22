"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, Paintbrush, Database, Sparkles } from "lucide-react";
import { PublicNavbar } from "../../components/public-navbar";
import Link from "next/link";

export default function RegisterInstitution() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", overflow: "hidden", position: "relative" }}>
      
      {/* Background Glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "120vw", height: "120vw", maxWidth: 1200, maxHeight: 1200, background: "radial-gradient(circle, rgba(25,195,125,0.15) 0%, rgba(138,43,226,0.05) 30%, rgba(0,0,0,0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      
      <PublicNavbar />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "80px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(25, 195, 125, 0.1)", border: "1px solid rgba(25, 195, 125, 0.2)", borderRadius: 100, padding: "8px 20px", marginBottom: 24 }}>
            <Sparkles size={14} color="#19c37d" />
            <span style={{ color: "#19c37d", fontSize: 13, fontWeight: 600 }}>Multi-Tenant Architecture</span>
          </div>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 24px 0" }}>
            Bring KiliGuide to <br/>
            <span style={{ background: "linear-gradient(90deg, #ffffff 0%, #19c37d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Your University.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#a1a1aa", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            Set up an isolated, branded AI workspace for your students in minutes. Zero coding required. Complete data privacy guaranteed.
          </p>
        </motion.div>

        {/* The 3-Step Setup Procedure */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, width: "100%", marginBottom: 60 }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel" style={{ padding: 32 }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
              <Building2 size={24} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Create Account</h3>
            <p style={{ color: "#a1a1aa", fontSize: 15, lineHeight: 1.6 }}>
              Provide your university name and official domain (e.g. students.uonbi.ac.ke). We automatically route students logging in with this domain to your isolated workspace.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="glass-panel" style={{ padding: 32 }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: "1px solid rgba(139, 92, 246, 0.2)" }}>
              <Paintbrush size={24} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Configure Branding</h3>
            <p style={{ color: "#a1a1aa", fontSize: 15, lineHeight: 1.6 }}>
              Upload your university logo and select your primary brand color. The entire KiliGuide interface dynamically updates to match your institution's aesthetic.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="glass-panel" style={{ padding: 32 }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <Database size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. Upload Data</h3>
            <p style={{ color: "#a1a1aa", fontSize: 15, lineHeight: 1.6 }}>
              Your workspace is ready instantly. Log in to the Super Admin portal to upload timetables, course structures, and securely connect the MCP Database.
            </p>
          </motion.div>

        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        >
          {/* Mock button for now until backend is wired up */}
          <button style={{ background: "#19c37d", color: "#fff", border: "none", padding: "16px 32px", borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(25, 195, 125, 0.3)" }}>
            Start Setup Wizard <ArrowRight size={18} />
          </button>
          <span style={{ fontSize: 13, color: "#a1a1aa" }}>Already registered? <Link href="/login" style={{ color: "#19c37d", textDecoration: "none" }}>Log in to your workspace.</Link></span>
        </motion.div>

      </div>
    </main>
  );
}
