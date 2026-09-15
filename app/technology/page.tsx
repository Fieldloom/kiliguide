import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";
import { Database, Shield, Zap } from "lucide-react";

export default function TechnologyPage() {
  return (
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden">
      <div className="absolute -top-[10%] left-[30%] w-[100vw] h-[100vw] bg-[radial-gradient(circle,rgba(25,195,125,0.06)_0%,rgba(0,0,0,0)_60%)] z-0 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8">
        <PublicNavbar />
        
        <div className="max-w-3xl mx-auto my-12 sm:my-20 text-center px-2">
          <h1 className="text-[clamp(30px,5vw,64px)] font-extrabold tracking-tight mb-4 leading-tight">
            Built for <span className="text-[#19c37d]">Scale & Speed.</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto">
            KiliGuide uses state-of-the-art AI infrastructure. By combining edge computing with highly structured vector databases, we deliver instant answers without compromising on accuracy.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:gap-8 max-w-4xl mx-auto mb-16 sm:mb-24">
          
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.02)] p-6 sm:p-10 rounded-3xl items-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/10 grid place-items-center flex-shrink-0">
              <Database size={26} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">Retrieval-Augmented Generation (RAG)</h3>
              <p className="text-zinc-400 leading-relaxed text-sm sm:text-base m-0">
                Large Language Models hallucinate. To solve this, we don't just rely on the AI's internal memory. Every question you ask is instantly cross-referenced against a highly optimized vector database of official DeKUT documents. The AI is forced to cite its sources, guaranteeing 98% accuracy.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.02)] p-6 sm:p-10 rounded-3xl items-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#19c37d]/10 grid place-items-center flex-shrink-0">
              <Zap size={26} className="text-[#19c37d]" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">Edge Computing</h3>
              <p className="text-zinc-400 leading-relaxed text-sm sm:text-base m-0">
                Traditional servers are too slow for real-time chat. KiliGuide's backend logic runs entirely on Supabase Edge Functions globally distributed via Deno. This means your query executes physically closer to you, slashing latency and delivering answers in milliseconds.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.02)] p-6 sm:p-10 rounded-3xl items-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-500/10 grid place-items-center flex-shrink-0">
              <Shield size={26} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">Row Level Security (RLS)</h3>
              <p className="text-zinc-400 leading-relaxed text-sm sm:text-base m-0">
                Security isn't an afterthought. Our entire PostgreSQL database is locked down with cryptographic Row Level Security policies. This means that at a mathematical level, the database physically rejects any request to access a chat or timetable that doesn't explicitly belong to your authenticated session token.
              </p>
            </div>
          </div>

        </div>

        <PublicFooter />
      </div>
    </main>
  );
}
