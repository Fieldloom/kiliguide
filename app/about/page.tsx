"use client";

import { motion } from "framer-motion";
import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";
import { Users, GraduationCap, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="bg-aurora min-h-screen text-zinc-200 relative overflow-x-hidden">
      <div className="absolute -top-[10%] left-[30%] w-[100vw] h-[100vw] bg-[radial-gradient(circle,rgba(25,195,125,0.06)_0%,rgba(0,0,0,0)_60%)] z-0 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8">
        <PublicNavbar />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto my-12 sm:my-20 py-4 px-2"
        >
          <div className="inline-flex items-center gap-2 bg-[#19c37d]/10 border border-[#19c37d]/20 rounded-full px-4 py-2 mb-6">
            <Users size={14} className="text-[#19c37d]" />
            <span className="text-[#19c37d] text-xs sm:text-sm font-semibold">Who we are</span>
          </div>
          
          <h1 className="text-[clamp(28px,5vw,56px)] font-extrabold tracking-tight mb-6 leading-tight text-white">
            Built by <span className="text-[#19c37d]">KiliMind AI</span>. <br className="hidden sm:inline" /> Designed for Students.
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-10">
            KiliGuide is more than just a software platform; it is a vision for the future of higher education in Africa. Developed entirely by KiliMind AI, we are committed to solving the friction between students and complex university bureaucracies through cutting-edge Artificial Intelligence.
          </p>

          <div className="flex flex-col gap-6">
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[inset_0_0_40px_rgba(255,255,255,0.01)]">
              <div className="w-12 h-12 bg-[#19c37d]/10 rounded-2xl grid place-items-center mb-5">
                <GraduationCap size={24} className="text-[#19c37d]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">Our Mission at DeKUT</h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed m-0">
                We built KiliGuide with Dedan Kimathi University of Technology (DeKUT) in mind. Our goal is to transform the campus experience—giving students instant access to timetables, transparent fee structures, and immediate support, all without ever needing to stand in a queue.
              </p>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[inset_0_0_40px_rgba(255,255,255,0.01)]">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl grid place-items-center mb-5">
                <Sparkles size={24} className="text-purple-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">The Future of KiliMind AI</h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed m-0">
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
