import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";

export default function TermsPage() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "100vw", height: "100vw", background: "radial-gradient(circle, rgba(25,195,125,0.06) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />
      
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <PublicNavbar />
        
        <div style={{ maxWidth: 800, margin: "80px auto 100px", background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 24, padding: "60px" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Terms of Use</h1>
          <p style={{ color: "#a1a1aa", marginBottom: 40, fontSize: 15 }}>Last updated: July 2026</p>

          <div style={{ color: "#ececec", lineHeight: 1.7, fontSize: 16, display: "flex", flexDirection: "column", gap: 24 }}>
            <p>
              Welcome to KiliGuide. By accessing or using our platform, you agree to be bound by these Terms of Use. Please read them carefully.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>1. Acceptance of Terms</h2>
            <p>
              By using KiliGuide, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use the service.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>2. Intended Use</h2>
            <p>
              KiliGuide is an AI assistant designed to help DeKUT students navigate university resources, timetables, and policies. It is intended for informational and educational purposes only.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>3. Accuracy of Information</h2>
            <p>
              While KiliGuide uses Retrieval-Augmented Generation (RAG) to cite official university documents, Artificial Intelligence can still occasionally produce inaccurate information ("hallucinations"). <strong>You must independently verify critical information</strong> (such as exam dates or fee deadlines) through official university portals or administration offices. KiliGuide is not liable for academic or financial consequences resulting from reliance on the AI.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>4. Acceptable Conduct</h2>
            <p>
              You agree not to use KiliGuide to:
              <br/>- Attempt to bypass or break the system's security (RLS policies).
              <br/>- Upload malicious files disguised as timetables or documents.
              <br/>- Harass, abuse, or engage in unethical behavior using the platform.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>5. Service Modifications</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the service (or any part thereof) at any time, with or without notice to you. We shall not be liable to you or to any third party for any modification or suspension of the service.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>6. Governing Law</h2>
            <p>
              These terms shall be governed and construed in accordance with the laws of Kenya, and any disputes will be subject to the exclusive jurisdiction of the courts of Kenya.
            </p>
          </div>
        </div>

        <PublicFooter />
      </div>

      <style>{`body { background: #000000 !important; }`}</style>
    </main>
  );
}
