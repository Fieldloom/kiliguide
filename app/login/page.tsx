"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { getRoleDestination } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  
  // Role-based metadata
  const [role, setRole] = useState("student");
  const [regNum, setRegNum] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setMessage("Connect Supabase to enable secure sign-in."); return; }
    setBusy(true);
    
    let result;
    if (mode === "signin") {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      // Pass the metadata directly into signup
      result = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          emailRedirectTo: `${location.origin}/auth/callback`, 
          data: { 
            full_name: email.split("@")[0],
            role,
            registration_number: role === "student" ? regNum : null,
            department_id: role === "staff" ? departmentId : null
          } 
        } 
      });
    }
    
    if (result.error) {
      setMessage(result.error.message);
      setBusy(false);
      return;
    }
    
    if (mode === "signup") {
      // If auto-confirm is enabled, they might already be logged in. If not:
      setMessage("Check your email to confirm your account.");
      setBusy(false);
      return;
    }
    
    const destination = await getRoleDestination();
    router.replace(destination);
  };

  return (
    <main className="ambient-bg" style={{ minHeight: "100vh", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" }}>
      
      {/* Background Glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80vw", height: "80vw", maxWidth: 1000, maxHeight: 1000, background: "radial-gradient(circle, rgba(25,195,125,0.08) 0%, rgba(0,0,0,0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(25,195,125,0.3), transparent)", zIndex: 0 }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <Link href="/" style={{ width: 56, height: 56, borderRadius: 16, background: "#0B0F14", display: "grid", placeItems: "center", border: "1px solid #1A2A20", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: 15 }}>
            {mode === "signin" ? "Enter your details to access your portal." : "Join the AI-powered university experience."}
          </p>
        </div>

        <div style={{ background: "#0B0F14", border: "1px solid #131820", borderRadius: 24, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {mode === "signup" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Select Your Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#ffffff", padding: "14px 16px", fontSize: 15, outline: "none", appearance: "none" }}>
                  <option value="student">Student</option>
                  <option value="staff">Staff Member</option>
                  <option value="parent">Parent</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
            )}

            {mode === "signup" && role === "student" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Registration Number</label>
                <input required value={regNum} onChange={e => setRegNum(e.target.value)} placeholder="e.g. C026-01-0982/2021" style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#ffffff", padding: "14px 16px", fontSize: 15, outline: "none" }} />
              </div>
            )}

            {mode === "signup" && role === "staff" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Department</label>
                <select required value={departmentId} onChange={e => setDepartmentId(e.target.value)} style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#ffffff", padding: "14px 16px", fontSize: 15, outline: "none", appearance: "none" }}>
                  <option value="">Select Department...</option>
                  <option value="1">Computer Science</option>
                  <option value="2">Engineering</option>
                  <option value="3">Finance Office</option>
                  <option value="4">Registry</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Email Address</label>
              <input 
                required type="email" value={email} onChange={e => setEmail(e.target.value)} 
                placeholder="you@students.dekut.ac.ke"
                style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#ffffff", padding: "14px 16px", fontSize: 15, outline: "none", transition: "border-color 0.2s" }} 
                onFocus={e => (e.currentTarget.style.borderColor = "#19c37d")} onBlur={e => (e.currentTarget.style.borderColor = "#1A2A20")}
              />
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Password</label>
              <input 
                required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#ffffff", padding: "14px 16px", fontSize: 15, outline: "none", transition: "border-color 0.2s" }} 
                onFocus={e => (e.currentTarget.style.borderColor = "#19c37d")} onBlur={e => (e.currentTarget.style.borderColor = "#1A2A20")}
              />
            </div>

            {message && (
              <div style={{ background: message.includes("Check") ? "rgba(25, 195, 125, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `1px solid ${message.includes("Check") ? "rgba(25, 195, 125, 0.2)" : "rgba(239, 68, 68, 0.2)"}`, borderRadius: 12, padding: "12px 16px" }}>
                <p style={{ fontSize: 14, color: message.includes("Check") ? "#19c37d" : "#ef4444", margin: 0 }}>{message}</p>
              </div>
            )}

            <button 
              disabled={busy} 
              style={{ width: "100%", background: "#19c37d", color: "#000000", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 700, marginTop: 8, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.background = "#14a367" }}
              onMouseLeave={e => { if (!busy) e.currentTarget.style.background = "#19c37d" }}
            >
              {busy ? <Loader2 size={20} className="animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
              {!busy && <ArrowRight size={20} />}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <span style={{ fontSize: 14, color: "#a1a1aa" }}>
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} 
              style={{ background: "transparent", border: "none", color: "#19c37d", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
            >
              {mode === "signin" ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div style={{ marginTop: 32, padding: 16, background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <ShieldCheck size={20} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
              Authentication is currently disabled. Please configure your Supabase instance to enable secure sign-in.
            </p>
          </div>
        )}
      </div>

      <style>{`
        body { background: #000000 !important; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
