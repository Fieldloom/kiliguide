"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Plus, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PublicNavbar } from "./public-navbar";
import { PublicFooter } from "./public-footer";

export function TypewriterSearch() {
  const phrases = [
    "When is the next BSc Computer Science trip?",
    "Summarize the latest campus rules.",
    "What's my timetable for tomorrow?",
    "Where is the Engineering block?",
    "Check my fee balance."
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typingSpeed = 50;
    const deletingSpeed = 30;
    const delayBetweenPhrases = 2500;

    const handleType = () => {
      const fullPhrase = phrases[currentPhraseIndex];
      
      if (isDeleting) {
        setCurrentText(prev => prev.slice(0, -1));
        if (currentText === "") {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      } else {
        setCurrentText(fullPhrase.slice(0, currentText.length + 1));
        if (currentText === fullPhrase) {
          setTimeout(() => setIsDeleting(true), delayBetweenPhrases);
          return;
        }
      }
    };

    const timer = setTimeout(handleType, isDeleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhraseIndex]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{ 
        marginTop: 60,
        width: "100%", maxWidth: 680, 
        background: "rgba(255,255,255,0.03)", 
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.1)", 
        borderRadius: 100, 
        padding: "16px 24px", 
        display: "flex", alignItems: "center", gap: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,255,255,0.02), 0 0 0 1px rgba(25, 195, 125, 0.2)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Subtle sweeping glow inside the search bar */}
      <motion.div 
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "50%", background: "linear-gradient(90deg, transparent, rgba(25,195,125,0.1), transparent)", pointerEvents: "none" }}
      />

      <Sparkles size={24} style={{ color: "#19c37d", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", height: 28 }}>
        <span style={{ fontSize: 18, color: "#ececec", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden" }}>
          {currentText}
          <motion.span 
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ display: "inline-block", width: 2, height: 20, background: "#19c37d", marginLeft: 4, verticalAlign: "middle" }}
          />
        </span>
      </div>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
        <Mic size={18} style={{ color: "#a1a1aa" }} />
      </div>
    </motion.div>
  );
}

export function TrustedBy() {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.6 }}
      style={{ marginTop: 80, paddingBottom: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}
    >
      <span style={{ fontSize: 12, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Exclusive Partner</span>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <img src="https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Dedan_Kimathi_University_of_Technology_logo.png/220px-Dedan_Kimathi_University_of_Technology_logo.png" alt="DeKUT" style={{ width: 48, height: 48, objectFit: "contain", background: "#fff", borderRadius: "50%", padding: 4 }} />
        <b style={{ fontSize: 18, color: "#ececec", letterSpacing: "-0.02em" }}>Dedan Kimathi University of Technology</b>
      </div>
    </motion.section>
  );
}

export function WelcomePage() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", overflow: "hidden", position: "relative" }}>
      
      {/* Massive Central Glow for Apple Intelligence feel */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "120vw", height: "120vw", maxWidth: 1200, maxHeight: 1200, background: "radial-gradient(circle, rgba(25,195,125,0.15) 0%, rgba(138,43,226,0.05) 30%, rgba(0,0,0,0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      
      <PublicNavbar />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* Centered Hero Section */}
        <section style={{ minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingTop: 40 }}>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(25, 195, 125, 0.1)", border: "1px solid rgba(25, 195, 125, 0.2)", borderRadius: 100, padding: "8px 20px", marginBottom: 32 }}
          >
            <Sparkles size={14} color="#19c37d" />
            <span style={{ color: "#19c37d", fontSize: 13, fontWeight: 600 }}>Powered by KiliMind AI</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ fontSize: "clamp(48px, 6vw, 84px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em", margin: 0, maxWidth: 900 }}
          >
            The smartest way to <br/>
            <span style={{ background: "linear-gradient(90deg, #ffffff 0%, #19c37d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              navigate DeKUT.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: "clamp(18px, 2vw, 24px)", color: "#a1a1aa", marginTop: 24, maxWidth: 600, lineHeight: 1.5 }}
          >
            Your omniscient campus guide. Ask literally anything—from complex university policies to your next lecture venue—and get instant, perfectly accurate answers.
          </motion.p>

          <TypewriterSearch />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ display: "flex", gap: 16, marginTop: 48 }}
          >
            <Link href="/login" style={{ background: "#ffffff", color: "#000", borderRadius: 100, padding: "16px 32px", fontSize: 16, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, transition: "transform 0.2s, box-shadow 0.2s", boxShadow: "0 8px 30px rgba(255,255,255,0.2)" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,255,255,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(255,255,255,0.2)"; }}>
              Sign In to Ask <ArrowRight size={18} />
            </Link>
          </motion.div>

        </section>

        <TrustedBy />
      </div>

      <PublicFooter />
    </main>
  );
}
