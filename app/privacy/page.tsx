import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";

export default function PrivacyPage() {
  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "100vw", height: "100vw", background: "radial-gradient(circle, rgba(25,195,125,0.06) 0%, rgba(0,0,0,0) 60%)", zIndex: 0, pointerEvents: "none" }} />
      
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        <PublicNavbar />
        
        <div style={{ maxWidth: 800, margin: "80px auto 100px", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,255,255,0.02)", borderRadius: 32, padding: "60px" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: "#a1a1aa", marginBottom: 40, fontSize: 15 }}>Last updated: July 2026</p>

          <div style={{ color: "#ececec", lineHeight: 1.7, fontSize: 16, display: "flex", flexDirection: "column", gap: 24 }}>
            <p>
              At KiliGuide, your privacy is our absolute priority. We built this platform for DeKUT students with strict data protection mechanisms baked into the core architecture. This policy outlines how we handle your data.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>1. Data Isolation & Security</h2>
            <p>
              We utilize PostgreSQL Row Level Security (RLS) policies. This ensures that every piece of data you generate—from chat logs to uploaded timetables—is cryptographically isolated to your specific user ID. No other user, and not even application-level bugs, can expose your data to unauthorized parties.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>2. Artificial Intelligence & Training</h2>
            <p>
              KiliGuide uses state-of-the-art language models (LLMs) to answer your questions. <strong>We do not use your personal data to train these models.</strong> Your chat history and custom instructions are sent to the AI strictly for the duration of generating a single response, after which they are discarded by the AI provider.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>3. Data Deletion</h2>
            <p>
              You maintain absolute control over your data. Inside the KiliGuide settings panel, you can trigger a permanent hard-deletion of your chat history and timetable data. When you click delete, the data is instantly wiped from our databases via SQL `DELETE` commands. We do not soft-delete or retain copies.
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>4. Information We Collect</h2>
            <p>
              We only collect information strictly necessary to provide the service:
              <br/>- Your email address (for authentication via Supabase Auth)
              <br/>- Your explicitly provided "Custom Instructions"
              <br/>- Chat interactions (so you can view your history)
              <br/>- Timetable documents you explicitly choose to upload
            </p>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 16, marginBottom: -8 }}>5. Contact Us</h2>
            <p>
              If you have any questions regarding how your data is handled, or wish to exercise your data rights, please contact the DeKUT administration or the KiliGuide maintainers.
            </p>
          </div>
        </div>

        <PublicFooter />
      </div>

      <style>{`body { background: #000000 !important; }`}</style>
    </main>
  );
}
