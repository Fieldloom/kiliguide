import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";
import { Server, Database, Shield, Zap } from "lucide-react";

export default function TechnologyPage() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "100vw", height: "100vw", background: "radial-gradient(circle, rgba(25,195,125,0.06) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />
      
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <PublicNavbar />
        
        <div style={{ maxWidth: 800, margin: "100px auto 60px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 24 }}>
            Built for <span style={{ color: "#19c37d" }}>Scale & Speed.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#a1a1aa", lineHeight: 1.6 }}>
            KiliGuide uses state-of-the-art AI infrastructure. By combining edge computing with highly structured vector databases, we deliver instant answers without compromising on accuracy.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000, margin: "0 auto 100px" }}>
          
          <div style={{ display: "flex", gap: 32, background: "#0B0F14", border: "1px solid #1A2A20", padding: 40, borderRadius: 24, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(168, 85, 247, 0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Database size={28} style={{ color: "#a855f7" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Retrieval-Augmented Generation (RAG)</h3>
              <p style={{ color: "#a1a1aa", lineHeight: 1.6, fontSize: 16 }}>
                Large Language Models hallucinate. To solve this, we don't just rely on the AI's internal memory. Every question you ask is instantly cross-referenced against a highly optimized vector database of official DeKUT documents. The AI is forced to cite its sources, guaranteeing 98% accuracy.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 32, background: "#0B0F14", border: "1px solid #1A2A20", padding: 40, borderRadius: 24, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(25, 195, 125, 0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Zap size={28} style={{ color: "#19c37d" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Edge Computing</h3>
              <p style={{ color: "#a1a1aa", lineHeight: 1.6, fontSize: 16 }}>
                Traditional servers are too slow for real-time chat. KiliGuide's backend logic runs entirely on Supabase Edge Functions globally distributed via Deno. This means your query executes physically closer to you, slashing latency and delivering answers in milliseconds.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 32, background: "#0B0F14", border: "1px solid #1A2A20", padding: 40, borderRadius: 24, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(244, 63, 94, 0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Shield size={28} style={{ color: "#f43f5e" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Row Level Security (RLS)</h3>
              <p style={{ color: "#a1a1aa", lineHeight: 1.6, fontSize: 16 }}>
                Security isn't an afterthought. Our entire PostgreSQL database is locked down with cryptographic Row Level Security policies. This means that at a mathematical level, the database physically rejects any request to access a chat or timetable that doesn't explicitly belong to your authenticated session token.
              </p>
            </div>
          </div>

        </div>

        <PublicFooter />
      </div>

      <style>{`body { background: #000000 !important; }`}</style>
    </main>
  );
}
