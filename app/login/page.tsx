"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, Building2 } from "lucide-react";
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
  const [institutionId, setInstitutionId] = useState("");
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [detectedInstitution, setDetectedInstitution] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("system_settings").select("value").eq("key", "allow_institution_registration").single().then(({ data }) => {
      if (data && data.value === 'false') {
        setAllowRegistration(false);
        setInstitutionId("00000000-0000-0000-0000-000000000001");
      }
    });
  }, []);

  // Load institutions when switching to signup mode
  const loadInstitutions = async () => {
    if (!supabase || institutions.length > 0) return;
    const { data } = await supabase.from("institutions").select("id, name, domain").order("name");
    if (data) setInstitutions(data);
  };

  // On email blur: detect institution from domain (for sign-in awareness)
  const handleEmailBlur = async () => {
    if (!supabase || !email.includes("@")) return;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return;

    // Check exact match or suffix match (e.g. students.dkut.ac.ke → dkut.ac.ke)
    const { data } = await supabase
      .from("institutions")
      .select("id, name")
      .or(`domain.eq.${domain},domain.ilike.%${domain.split(".").slice(-3).join(".")}`)
      .limit(1);

    if (data && data.length > 0) {
      setDetectedInstitution(data[0].name);
      setInstitutionId(data[0].id);
    } else {
      setDetectedInstitution(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setMessage("Connect Supabase to enable secure sign-in."); return; }
    setBusy(true);
    
    let result;
    if (mode === "signin") {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          emailRedirectTo: `${location.origin}/auth/callback`, 
          data: { 
            full_name: email.split("@")[0],
            role,
            registration_number: role === "student" ? regNum : null,
            department_id: role === "staff" ? departmentId : null,
            institution_id: institutionId || null,
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
      setMessage("Check your email to confirm your account.");
      setBusy(false);
      return;
    }
    
    const destination = await getRoleDestination();
    router.replace(destination);
  };

  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      
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

        <div style={{ background: "rgba(10, 15, 20, 0.5)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 32, padding: "40px 32px", boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 0 32px rgba(255,255,255,0.02)" }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Email — shown first so domain detection can fire early */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, paddingLeft: 4 }}>Email Address</label>
              <input 
                required type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@students.campus.ac.ke"
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#ffffff", padding: "16px", fontSize: 15, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }} 
                onFocus={e => { e.currentTarget.style.borderColor = "#19c37d"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(25,195,125,0.3)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; handleEmailBlur(); }}
              />
              {/* Auto-detected institution badge */}
              {detectedInstitution && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(25,195,125,0.1)", border: "1px solid rgba(25,195,125,0.2)", borderRadius: 10, padding: "8px 12px" }}>
                  <Building2 size={14} color="#19c37d" />
                  <span style={{ fontSize: 13, color: "#19c37d", fontWeight: 600 }}>Routing to: {detectedInstitution}</span>
                </div>
              )}
            </div>

            {mode === "signup" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, paddingLeft: 4 }}>Select Your Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#ffffff", padding: "16px", fontSize: 15, outline: "none", appearance: "none", boxSizing: "border-box", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = "#19c37d"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}>
                  <option value="student">Student</option>
                  <option value="staff">Staff Member</option>
                  <option value="parent">Parent</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
            )}

            {/* University dropdown — shown only on signup if domain didn't auto-detect, and registration is allowed */}
            {mode === "signup" && !detectedInstitution && allowRegistration && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, paddingLeft: 4 }}>Your University</label>
                <select
                  required
                  value={institutionId}
                  onChange={e => setInstitutionId(e.target.value)}
                  onFocus={e => { loadInstitutions(); e.currentTarget.style.borderColor = "#19c37d"; }}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#ffffff", padding: "16px", fontSize: 15, outline: "none", appearance: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                >
                  <option value="">Select your university…</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: 13, color: "#8e8ea0", marginTop: 8, paddingLeft: 4 }}>Can&apos;t find your university? <Link href="/register-institution" style={{ color: "#19c37d", textDecoration: "none", fontWeight: 600 }}>Register it here.</Link></p>
              </div>
            )}

            {mode === "signup" && role === "student" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, paddingLeft: 4 }}>Registration Number</label>
                <input required value={regNum} onChange={e => setRegNum(e.target.value)} placeholder="e.g. C026-01-0982/2021" style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#ffffff", padding: "16px", fontSize: 15, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }} onFocus={e => { e.currentTarget.style.borderColor = "#19c37d"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(25,195,125,0.3)"; }} onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }} />
              </div>
            )}

            {mode === "signup" && role === "staff" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, paddingLeft: 4 }}>Department</label>
                <select required value={departmentId} onChange={e => setDepartmentId(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#ffffff", padding: "16px", fontSize: 15, outline: "none", appearance: "none", boxSizing: "border-box", transition: "all 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = "#19c37d"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}>
                  <option value="">Select Department...</option>
                  <option value="1">Computer Science</option>
                  <option value="2">Engineering</option>
                  <option value="3">Finance Office</option>
                  <option value="4">Registry</option>
                </select>
              </div>
            )}
            
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, paddingLeft: 4 }}>Password</label>
              <input 
                required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, color: "#ffffff", padding: "16px", fontSize: 15, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }} 
                onFocus={e => { e.currentTarget.style.borderColor = "#19c37d"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(25,195,125,0.3)"; }} 
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {message && (
              <div style={{ background: message.includes("Check") ? "rgba(25, 195, 125, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `1px solid ${message.includes("Check") ? "rgba(25, 195, 125, 0.2)" : "rgba(239, 68, 68, 0.2)"}`, borderRadius: 16, padding: "16px" }}>
                <p style={{ fontSize: 14, color: message.includes("Check") ? "#19c37d" : "#ef4444", margin: 0, fontWeight: 500 }}>{message}</p>
              </div>
            )}

            <button 
              disabled={busy} 
              style={{ width: "100%", background: "linear-gradient(135deg, #19c37d 0%, #14a367 100%)", color: "#000000", border: "none", borderRadius: 16, padding: "18px", fontSize: 16, fontWeight: 800, marginTop: 12, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 24px rgba(25,195,125,0.3)" }}
              onMouseEnter={e => { if (!busy) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(25,195,125,0.4)"; } }}
              onMouseLeave={e => { if (!busy) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(25,195,125,0.3)"; } }}
            >
              {busy ? <Loader2 size={20} className="animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
              {!busy && <ArrowRight size={20} />}
            </button>
          </form>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <span style={{ fontSize: 15, color: "#8e8ea0" }}>
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); setDetectedInstitution(null); }} 
              style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer", padding: 0, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#19c37d"}
              onMouseLeave={e => e.currentTarget.style.color = "#ffffff"}
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
