"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Building2, Paintbrush, Mail, Sparkles, CheckCircle2, Loader2, Globe, Clock } from "lucide-react";
import { PublicNavbar } from "../../components/public-navbar";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const STEPS = ["Your Details", "Branding", "Admin Account", "Submitted"];

export default function RegisterInstitution() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [themeColor, setThemeColor] = useState("#10b981");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };

  const handleStep0 = () => {
    if (!name.trim() || !domain.trim()) { setError("Please fill in all fields."); return; }
    if (!domain.includes(".")) { setError("Please enter a valid domain (e.g. students.myuniversity.ac.ke)."); return; }
    next();
  };

  const handleStep2 = async () => {
    if (!adminEmail.trim() || !adminName.trim()) { setError("Please fill in all fields."); return; }
    if (!supabase) { setError("Database not connected."); return; }

    setBusy(true);
    setError("");

    try {
      const { error: reqErr } = await supabase
        .from("institution_requests")
        .insert({
          name: name.trim(),
          domain: domain.trim().toLowerCase(),
          theme_color: themeColor,
          logo_url: logoUrl || null,
          admin_email: adminEmail.trim(),
          admin_name: adminName.trim(),
          status: "pending",
        });

      if (reqErr) throw reqErr;
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 }
  };

  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", color: "#ffffff", overflow: "hidden", position: "relative" }}>
      
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "120vw", height: "120vw", maxWidth: 1200, maxHeight: 1200, background: "radial-gradient(circle, rgba(25,195,125,0.12) 0%, rgba(138,43,226,0.04) 30%, rgba(0,0,0,0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      
      <PublicNavbar />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 680, margin: "0 auto", padding: "60px 24px" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(25,195,125,0.1)", border: "1px solid rgba(25,195,125,0.2)", borderRadius: 100, padding: "8px 20px", marginBottom: 20 }}>
            <Sparkles size={14} color="#19c37d" />
            <span style={{ color: "#19c37d", fontSize: 13, fontWeight: 600 }}>Institution Registration</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px 0" }}>
            Bring KiliGuide to <span style={{ background: "linear-gradient(90deg, #fff 0%, #19c37d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Your University.</span>
          </h1>
          <p style={{ fontSize: 16, color: "#a1a1aa", margin: 0 }}>Submit your institution details. Our team reviews every request within 24 hours.</p>
        </div>

        {/* Step Progress */}
        {step < 3 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40, justifyContent: "center" }}>
            {STEPS.slice(0, 3).map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, background: i < step ? "#19c37d" : i === step ? "rgba(25,195,125,0.2)" : "rgba(255,255,255,0.05)", color: i <= step ? "#19c37d" : "#666", border: `2px solid ${i <= step ? "#19c37d" : "rgba(255,255,255,0.08)"}`, transition: "all 0.3s" }}>
                    {i < step ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: i === step ? "#fff" : "#666", whiteSpace: "nowrap" }}>{label}</span>
                </div>
                {i < 2 && <div style={{ width: 32, height: 2, background: i < step ? "#19c37d" : "rgba(255,255,255,0.08)", borderRadius: 2, transition: "all 0.3s" }} />}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "#0B0F14", border: "1px solid #131820", borderRadius: 24, padding: 40, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
          <AnimatePresence mode="wait">

            {step === 0 && (
              <motion.div key="step0" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(59,130,246,0.1)", display: "grid", placeItems: "center", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <Building2 size={22} color="#3b82f6" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>University Details</h2>
                    <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>Tell us about your institution.</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Full University Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. University of Nairobi" style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#fff", padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} onFocus={e => e.currentTarget.style.borderColor = "#19c37d"} onBlur={e => e.currentTarget.style.borderColor = "#1A2A20"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Official Student Email Domain</label>
                    <div style={{ position: "relative" }}>
                      <Globe size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#666" }} />
                      <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. students.uonbi.ac.ke" style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#fff", padding: "14px 16px 14px 44px", fontSize: 15, outline: "none", boxSizing: "border-box" }} onFocus={e => e.currentTarget.style.borderColor = "#19c37d"} onBlur={e => e.currentTarget.style.borderColor = "#1A2A20"} />
                    </div>
                    <p style={{ fontSize: 12, color: "#6b6b80", marginTop: 6 }}>Students with this domain will be auto-routed to your workspace on login.</p>
                  </div>
                </div>
                {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 16, background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>}
                <button onClick={handleStep0} style={{ marginTop: 28, width: "100%", background: "#19c37d", color: "#000", border: "none", borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Continue <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(139,92,246,0.1)", display: "grid", placeItems: "center", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <Paintbrush size={22} color="#8b5cf6" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Branding (Optional)</h2>
                    <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>Customize your workspace appearance.</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>University Logo URL (optional)</label>
                    <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://youruni.ac.ke/logo.png" style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#fff", padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} onFocus={e => e.currentTarget.style.borderColor = "#19c37d"} onBlur={e => e.currentTarget.style.borderColor = "#1A2A20"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Primary Brand Color</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ width: 56, height: 48, borderRadius: 12, border: "1px solid #1A2A20", background: "none", cursor: "pointer", padding: 4 }} />
                      <div style={{ flex: 1, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${themeColor}33, ${themeColor}22)`, border: `1px solid ${themeColor}44`, display: "flex", alignItems: "center", paddingLeft: 16 }}>
                        <span style={{ color: themeColor, fontWeight: 600, fontSize: 14 }}>{themeColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  <button onClick={back} style={{ flex: "0 0 auto", background: "rgba(255,255,255,0.05)", color: "#ececec", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "15px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={next} style={{ flex: 1, background: "#19c37d", color: "#000", border: "none", borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(16,185,129,0.1)", display: "grid", placeItems: "center", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <Mail size={22} color="#10b981" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Contact Details</h2>
                    <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>Who should we contact when approved?</p>
                  </div>
                </div>
                <div style={{ marginBottom: 20, padding: 16, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Clock size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0, lineHeight: 1.6 }}>Your request will be reviewed by our team within <strong style={{ color: "#f59e0b" }}>24–48 hours</strong>. You will receive an email with your admin credentials once approved.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Your Full Name</label>
                    <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="e.g. Dr. John Kamau" style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#fff", padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} onFocus={e => e.currentTarget.style.borderColor = "#19c37d"} onBlur={e => e.currentTarget.style.borderColor = "#1A2A20"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 8 }}>Official Email Address</label>
                    <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@youruni.ac.ke" style={{ width: "100%", background: "#06080A", border: "1px solid #1A2A20", borderRadius: 12, color: "#fff", padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box" }} onFocus={e => e.currentTarget.style.borderColor = "#19c37d"} onBlur={e => e.currentTarget.style.borderColor = "#1A2A20"} />
                  </div>
                </div>
                {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 16, background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>}
                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  <button onClick={back} disabled={busy} style={{ flex: "0 0 auto", background: "rgba(255,255,255,0.05)", color: "#ececec", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "15px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={handleStep2} disabled={busy} style={{ flex: 1, background: "#19c37d", color: "#000", border: "none", borderRadius: 12, padding: "15px", fontSize: 15, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {busy ? <Loader2 size={20} className="spin" /> : <>Submit Request <ArrowRight size={18} /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} style={{ textAlign: "center", padding: "20px 0" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.3)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                  <CheckCircle2 size={36} color="#10b981" />
                </motion.div>
                <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px 0" }}>Request Submitted!</h2>
                <p style={{ fontSize: 16, color: "#a1a1aa", marginBottom: 8, lineHeight: 1.6 }}>
                  Your application for <strong style={{ color: "#fff" }}>{name}</strong> has been received.
                </p>
                <p style={{ fontSize: 14, color: "#6b6b80", marginBottom: 32, lineHeight: 1.7 }}>
                  Our team will review your request and send admin credentials to <strong style={{ color: "#a1a1aa" }}>{adminEmail}</strong> within <strong style={{ color: "#f59e0b" }}>24–48 hours</strong>.
                </p>
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", color: "#ececec", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Back to Home
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {step < 3 && (
          <p style={{ textAlign: "center", fontSize: 13, color: "#6b6b80", marginTop: 24 }}>
            Already registered? <Link href="/login" style={{ color: "#19c37d", textDecoration: "none" }}>Log in to your workspace.</Link>
          </p>
        )}
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
