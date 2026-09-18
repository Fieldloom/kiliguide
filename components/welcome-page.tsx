"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Mic } from "lucide-react";
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
      className="mt-8 sm:mt-14 w-full max-w-[680px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-full px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.02),0_0_0_1px_rgba(25,195,125,0.2)] relative overflow-hidden"
    >
      {/* Subtle sweeping glow inside the search bar */}
      <motion.div 
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-[#19c37d]/10 to-transparent pointer-events-none"
      />

      <Sparkles size={20} className="text-[#19c37d] flex-shrink-0" />
      
      <div className="flex-1 flex items-center h-7 min-w-0 overflow-hidden">
        <span className="text-sm sm:text-base text-zinc-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {currentText}
          <motion.span 
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-0.5 h-4 sm:h-5 bg-[#19c37d] ml-1 align-middle"
          />
        </span>
      </div>

      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center cursor-pointer transition-colors flex-shrink-0">
        <Mic size={16} className="text-zinc-400" />
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
      className="mt-12 sm:mt-20 pb-12 sm:pb-16 flex flex-col items-center gap-4 sm:gap-6 text-center"
    >
      <span className="text-[11px] sm:text-xs text-zinc-500 uppercase tracking-widest font-semibold">Supporters & Ecosystem Partners</span>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 px-4">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-md shadow-lg">
          <img src="/dekut_logo.png" alt="DeKUT" className="w-9 h-9 sm:w-11 sm:h-11 object-contain bg-white rounded-xl p-1 shadow-md" />
          <div className="text-left">
            <b className="text-sm sm:text-base text-zinc-200 tracking-tight block">Dedan Kimathi University</b>
            <span className="text-[10px] sm:text-xs text-zinc-400">Institutional Partner</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-md shadow-lg">
          <img src="/think_logo.svg" alt="THiNK Tech Innovators Network" className="w-9 h-9 sm:w-11 sm:h-11 object-contain bg-white rounded-xl p-1 shadow-md" />
          <div className="text-left">
            <b className="text-sm sm:text-base text-zinc-200 tracking-tight block">THiNK</b>
            <span className="text-[10px] sm:text-xs text-purple-400 font-semibold tracking-wider block">TECH INNOVATORS NETWORK</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function WelcomePage() {
  return (
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden">
      
      {/* Massive Central Glow for Apple Intelligence feel */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[140vw] sm:w-[120vw] h-[140vw] sm:h-[120vw] max-w-[1200px] max-h-[1200px] bg-[radial-gradient(circle,rgba(25,195,125,0.15)_0%,rgba(138,43,226,0.05)_30%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none" />
      
      <PublicNavbar />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 flex flex-col items-center">
        
        {/* Centered Hero Section */}
        <section className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center pt-6 sm:pt-10 pb-12 w-full max-w-4xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 bg-[#19c37d]/10 border border-[#19c37d]/20 rounded-full px-4 py-2 mb-6 sm:mb-8"
          >
            <Sparkles size={14} className="text-[#19c37d]" />
            <span className="text-[#19c37d] text-xs sm:text-sm font-semibold">Powered by KiliMind AI</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(30px,6.5vw,76px)] font-extrabold leading-[1.1] tracking-tight m-0 max-w-4xl px-2"
          >
            The smartest way to <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-zinc-100 to-[#19c37d] bg-clip-text text-transparent">
              navigate campus.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[clamp(15px,3.5vw,22px)] text-zinc-400 mt-5 sm:mt-6 max-w-2xl leading-relaxed px-4"
          >
            Your omniscient campus guide. Ask literally anything—from complex university policies to your next lecture venue—and get instant, perfectly accurate answers.
          </motion.p>

          <TypewriterSearch />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-4 mt-8 sm:mt-12"
          >
            <Link 
              href="/login" 
              className="bg-white hover:bg-zinc-100 text-black rounded-full px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-bold no-underline flex items-center gap-2 transition-all transform hover:scale-105 shadow-[0_8px_30px_rgba(255,255,255,0.2)]"
            >
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
