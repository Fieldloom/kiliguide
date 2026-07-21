import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";
import { Target, Lightbulb, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VisionPage() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "100vw", height: "100vw", background: "radial-gradient(circle, rgba(25,195,125,0.06) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />
      
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <PublicNavbar />
        
        <div style={{ maxWidth: 800, margin: "100px auto 60px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 24 }}>
            Empowering the <span style={{ color: "#19c37d" }}>DeKUT Experience.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#a1a1aa", lineHeight: 1.6 }}>
            KiliGuide was built to solve a simple problem: navigating university life is too complex. 
            We believe that every student deserves instant, accurate, and private access to the information they need to succeed.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32, marginBottom: 100 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.02)", borderRadius: 32, padding: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(25, 195, 125, 0.1)", display: "grid", placeItems: "center", marginBottom: 24 }}>
              <Target size={24} style={{ color: "#19c37d" }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Our Mission</h3>
            <p style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
              To democratize access to campus knowledge by building the most intelligent, reliable, and user-centric university assistant in Africa.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.02)", borderRadius: 32, padding: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(56, 189, 248, 0.1)", display: "grid", placeItems: "center", marginBottom: 24 }}>
              <Users size={24} style={{ color: "#38bdf8" }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Student First</h3>
            <p style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
              Every feature we build starts with the student. No more hunting through PDFs, no more standing in lines for basic inquiries. Just answers.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.02)", borderRadius: 32, padding: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(244, 63, 94, 0.1)", display: "grid", placeItems: "center", marginBottom: 24 }}>
              <Lightbulb size={24} style={{ color: "#f43f5e" }} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Innovation</h3>
            <p style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
              We leverage cutting-edge Retrieval-Augmented Generation (RAG) and edge computing to ensure responses are not just fast, but verifiably accurate.
            </p>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(25, 195, 125, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)", border: "1px solid rgba(25, 195, 125, 0.2)", borderRadius: 32, padding: "60px 40px", textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Ready to experience the future of campus?</h2>
          <p style={{ color: "#a1a1aa", fontSize: 16, marginBottom: 32 }}>Join thousands of DeKUT students already using KiliGuide.</p>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#19c37d", color: "#000", padding: "12px 24px", borderRadius: 24, fontWeight: 700, textDecoration: "none" }}>
            Get Started Now <ArrowRight size={18} />
          </Link>
        </div>

        <PublicFooter />
      </div>

      <style>{`body { background: #000000 !important; }`}</style>
    </main>
  );
}
