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

  const [departments, setDepartments] = useState<any[]>([]);
  const [isRequestingNewDept, setIsRequestingNewDept] = useState(false);
  const [customDeptName, setCustomDeptName] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.from("system_settings").select("value").eq("key", "allow_institution_registration").single().then(({ data }) => {
      if (data && data.value === 'false') {
        setAllowRegistration(false);
      }
    });
  }, []);

  // Load institutions when in signup mode
  const loadInstitutions = async () => {
    if (!supabase || institutions.length > 0) return;
    const { data } = await supabase.from("institutions").select("id, name, domain").order("name");
    if (data && data.length > 0) {
      setInstitutions(data);
      if (!institutionId) setInstitutionId(data[0].id);
    }
  };

  // Load departments if available
  const loadDepartments = async (targetInstId?: string) => {
    if (!supabase) return;
    const instId = targetInstId || institutionId;
    let query = supabase.from("departments").select("id, name").order("name");
    if (instId) {
      query = query.eq("institution_id", instId);
    }
    const { data } = await query;
    setDepartments(data || []);
  };

  useEffect(() => {
    if (mode === "signup") {
      loadInstitutions();
      if (role === "staff") loadDepartments(institutionId);
    }
  }, [mode, role, institutionId]);

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
    setMessage("");

    try {
      let result;
      if (mode === "signin") {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        const isUuid = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
        
        result = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            emailRedirectTo: `${location.origin}/auth/callback`, 
            data: { 
              full_name: email.split("@")[0],
              role,
              registration_number: role === "student" ? regNum : null,
              department_id: (role === "staff" && !isRequestingNewDept && isUuid(departmentId)) ? departmentId : null,
              pending_department_name: (role === "staff" && isRequestingNewDept && customDeptName.trim()) ? customDeptName.trim() : null,
              institution_id: (institutionId && isUuid(institutionId)) ? institutionId : null,
            } 
          } 
        });
      }
      
      if (result.error) {
        let errorMsg = result.error.message;
        if (!errorMsg || errorMsg === "{}" || typeof errorMsg !== "string" || errorMsg.trim() === "") {
          errorMsg = mode === "signin"
            ? "Invalid login credentials. Please verify your email and password."
            : "Account creation failed. If you already have an account, try signing in.";
        }
        setMessage(errorMsg);
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
    } catch (err: any) {
      console.error("Authentication error:", err);
      const catchMsg = err?.message && err.message !== "{}" 
        ? err.message 
        : "An error occurred during authentication. Please try again.";
      setMessage(catchMsg);
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!supabase) { setMessage("Connect Supabase to enable password reset."); return; }
    if (!email || !email.includes("@")) {
      setMessage("Please enter your email address above, then click 'Forgot password?'.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/portal`,
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Check your email for the password reset link.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Could not send reset password email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-aurora min-h-screen text-white flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-x-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[80vw] h-[90vw] sm:h-[80vw] max-w-[1000px] max-h-[1000px] bg-[radial-gradient(circle,rgba(25,195,125,0.08)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#19c37d]/30 to-transparent z-0" />

      <div className="w-full max-w-md relative z-10 py-6 sm:py-10">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Link href="/" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0B0F14] grid place-items-center border border-[#1A2A20] shadow-2xl overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover transform scale-125" />
          </Link>
        </div>

        <div className="text-center mb-6 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            {mode === "signin" ? "Enter your details to access your portal." : "Join the AI-powered university experience."}
          </p>
        </div>

        <div className="bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_0_32px_rgba(255,255,255,0.02)]">
          <form onSubmit={submit} className="flex flex-col gap-4 sm:gap-5">
            
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Email Address</label>
              <input 
                required type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d] focus:ring-1 focus:ring-[#19c37d]/30"
                onBlur={handleEmailBlur}
              />
              {/* Auto-detected institution badge */}
              {detectedInstitution && (
                <div className="mt-2.5 flex items-center gap-2 bg-[#19c37d]/10 border border-[#19c37d]/20 rounded-lg p-2.5">
                  <Building2 size={14} className="text-[#19c37d]" />
                  <span className="text-xs text-[#19c37d] font-semibold">Routing to: {detectedInstitution}</span>
                </div>
              )}
            </div>

            {mode === "signup" && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Select Your Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d]">
                  <option value="student" className="bg-zinc-900">Student</option>
                  <option value="staff" className="bg-zinc-900">Staff Member</option>
                  <option value="parent" className="bg-zinc-900">Parent</option>
                  <option value="visitor" className="bg-zinc-900">Visitor</option>
                </select>
              </div>
            )}

            {/* University dropdown */}
            {mode === "signup" && !detectedInstitution && allowRegistration && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Your University</label>
                <select
                  required
                  value={institutionId}
                  onChange={e => setInstitutionId(e.target.value)}
                  onFocus={loadInstitutions}
                  className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d]"
                >
                  <option value="" className="bg-zinc-900">Select your university / institution...</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id} className="bg-zinc-900">{inst.name}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-2 pl-1">Can&apos;t find your university? <Link href="/register-institution" className="text-[#19c37d] no-underline font-semibold hover:underline">Register it here.</Link></p>
              </div>
            )}

            {mode === "signup" && role === "staff" && (
              <div className="animate-fadeIn space-y-2">
                <label className="block text-xs font-semibold text-zinc-400 pl-1">Department</label>
                
                {!isRequestingNewDept ? (
                  <>
                    <select 
                      value={departmentId} 
                      onChange={e => setDepartmentId(e.target.value)} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d]"
                    >
                      <option value="" className="bg-zinc-900">Select your Department...</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id} className="bg-zinc-900">{dept.name}</option>
                      ))}
                    </select>
                    
                    <div className="flex justify-between items-center pl-1 pt-1">
                      <button 
                        type="button" 
                        onClick={() => { setIsRequestingNewDept(true); setDepartmentId(""); }} 
                        className="text-xs text-[#19c37d] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer flex items-center gap-1"
                      >
                        <span>➕ Can&apos;t find your department? Request missing department</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-[#19c37d] flex items-center gap-1">
                        <span>📝 Request Missing Department</span>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => { setIsRequestingNewDept(false); setCustomDeptName(""); }} 
                        className="text-[11px] text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer underline"
                      >
                        Select from list instead
                      </button>
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder="Type missing department name (e.g. Mechanical Engineering)..." 
                      value={customDeptName} 
                      onChange={e => setCustomDeptName(e.target.value)} 
                      className="w-full bg-black/40 border border-white/10 rounded-lg text-white p-3 text-xs outline-none focus:border-[#19c37d]"
                    />
                    
                    <p className="text-[11px] text-zinc-400 leading-normal m-0">
                      Your institution administrator will check, confirm, and create this department when setting up your account roles.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <div className="flex items-center justify-between mb-1.5 pl-1">
                <label className="block text-xs font-semibold text-zinc-400">Password</label>
                {mode === "signin" && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-[#19c37d] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input 
                required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d] focus:ring-1 focus:ring-[#19c37d]/30"
              />
            </div>

            {message && (
              <div className={`p-3.5 rounded-xl border ${message.includes("Check") ? "bg-[#19c37d]/10 border-[#19c37d]/20 text-[#19c37d]" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                <p className="text-xs sm:text-sm m-0 font-medium">{message}</p>
              </div>
            )}

            <button 
              disabled={busy} 
              className="w-full bg-gradient-to-r from-[#19c37d] to-[#14a367] text-black font-extrabold border-none rounded-xl p-4 text-sm sm:text-base mt-2 cursor-pointer transition-all hover:shadow-[0_8px_24px_rgba(25,195,125,0.3)] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <span className="text-xs sm:text-sm text-zinc-400">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); setDetectedInstitution(null); }} 
              className="bg-transparent border-none text-white text-xs sm:text-sm font-bold cursor-pointer p-0 hover:text-[#19c37d] transition-colors"
            >
              {mode === "signin" ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-6 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex gap-3 items-start">
            <ShieldCheck size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400 m-0 leading-relaxed">
              Authentication is currently disabled. Please configure your Supabase instance to enable secure sign-in.
            </p>
          </div>
        )}
      </div>

    </main>
  );
}
