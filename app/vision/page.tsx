import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";
import { Target, Lightbulb, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VisionPage() {
  return (
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden">
      <div className="absolute -top-[10%] left-[30%] w-[100vw] h-[100vw] bg-[radial-gradient(circle,rgba(25,195,125,0.06)_0%,rgba(0,0,0,0)_60%)] z-0 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8">
        <PublicNavbar />
        
        <div className="max-w-3xl mx-auto my-12 sm:my-20 text-center px-2">
          <h1 className="text-[clamp(30px,5vw,64px)] font-extrabold tracking-tight mb-4 leading-tight">
            Empowering the <span className="text-[#19c37d]">DeKUT Experience.</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto">
            KiliGuide was built to solve a simple problem: navigating university life is too complex. 
            We believe that every student deserves instant, accurate, and private access to the information they need to succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-24">
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.02)] rounded-3xl p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#19c37d]/10 grid place-items-center mb-6">
              <Target size={24} className="text-[#19c37d]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Our Mission</h3>
            <p className="text-zinc-400 leading-relaxed text-sm sm:text-base m-0">
              To democratize access to campus knowledge by building the most intelligent, reliable, and user-centric university assistant in Africa.
            </p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.02)] rounded-3xl p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 grid place-items-center mb-6">
              <Users size={24} className="text-sky-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Student First</h3>
            <p className="text-zinc-400 leading-relaxed text-sm sm:text-base m-0">
              Every feature we build starts with the student. No more hunting through PDFs, no more standing in lines for basic inquiries. Just answers.
            </p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.02)] rounded-3xl p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 grid place-items-center mb-6">
              <Lightbulb size={24} className="text-rose-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Innovation</h3>
            <p className="text-zinc-400 leading-relaxed text-sm sm:text-base m-0">
              We leverage cutting-edge Retrieval-Augmented Generation (RAG) and edge computing to ensure responses are not just fast, but verifiably accurate.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#19c37d]/10 to-emerald-900/10 border border-[#19c37d]/20 rounded-3xl p-8 sm:p-14 text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Ready to experience the future of campus?</h2>
          <p className="text-zinc-400 text-sm sm:text-base mb-6 max-w-md mx-auto">Join thousands of DeKUT students already using KiliGuide.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-[#19c37d] hover:bg-[#15aa6d] text-black px-6 py-3.5 rounded-full font-bold no-underline transition-all transform hover:scale-105 shadow-lg">
            Get Started Now <ArrowRight size={18} />
          </Link>
        </div>

        <PublicFooter />
      </div>
    </main>
  );
}
