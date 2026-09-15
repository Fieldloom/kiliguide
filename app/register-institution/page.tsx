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
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden">
      
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] max-w-[1200px] max-h-[1200px] bg-[radial-gradient(circle,rgba(25,195,125,0.12)_0%,rgba(138,43,226,0.04)_30%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none" />
      
      <PublicNavbar />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-16">

        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-[#19c37d]/10 border border-[#19c37d]/20 rounded-full px-4 py-2 mb-4">
            <Sparkles size={14} className="text-[#19c37d]" />
            <span className="text-[#19c37d] text-xs sm:text-sm font-semibold">Institution Registration</span>
          </div>
          <h1 className="text-[clamp(28px,5vw,52px)] font-extrabold tracking-tight m-0 mb-3 leading-tight">
            Bring KiliGuide to <span className="bg-gradient-to-r from-white to-[#19c37d] bg-clip-text text-transparent">Your University.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 m-0 max-w-md mx-auto">Submit your institution details. Our team reviews every request within 24 hours.</p>
        </div>

        {/* Step Progress */}
        {step < 3 && (
          <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-10 justify-center overflow-x-auto py-2">
            {STEPS.slice(0, 3).map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold transition-all border-2 ${
                    i < step ? "bg-[#19c37d] text-black border-[#19c37d]" : i === step ? "bg-[#19c37d]/20 text-[#19c37d] border-[#19c37d]" : "bg-white/5 text-zinc-600 border-white/10"
                  }`}>
                    {i < step ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${i === step ? "text-white" : "text-zinc-500"} ${i !== step ? "hidden sm:inline" : ""}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`w-6 sm:w-10 h-0.5 rounded transition-all ${i < step ? "bg-[#19c37d]" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#0B0F14] border border-[#131820] rounded-3xl p-6 sm:p-10 shadow-2xl">
          <AnimatePresence mode="wait">

            {step === 0 && (
              <motion.div key="step0" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 grid place-items-center border border-blue-500/20">
                    <Building2 size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold m-0 text-white">University Details</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 m-0">Tell us about your institution.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full University Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. University of Nairobi" className="w-full bg-[#06080A] border border-[#1A2A20] rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none focus:border-[#19c37d]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Official Student Email Domain</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. students.uonbi.ac.ke" className="w-full bg-[#06080A] border border-[#1A2A20] rounded-xl text-white py-3.5 sm:py-4 pl-11 pr-4 text-sm outline-none focus:border-[#19c37d]" />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1.5">Students with this domain will be auto-routed to your workspace on login.</p>
                  </div>
                </div>
                {error && <p className="text-rose-400 text-xs sm:text-sm mt-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}
                <button onClick={handleStep0} className="mt-6 w-full bg-[#19c37d] text-black border-none rounded-xl p-4 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#15aa6d] transition-colors">
                  Continue <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 grid place-items-center border border-purple-500/20">
                    <Paintbrush size={22} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold m-0 text-white">Branding (Optional)</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 m-0">Customize your workspace appearance.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">University Logo URL (optional)</label>
                    <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://youruni.ac.ke/logo.png" className="w-full bg-[#06080A] border border-[#1A2A20] rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none focus:border-[#19c37d]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Primary Brand Color</label>
                    <div className="flex items-center gap-4">
                      <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-14 h-12 rounded-xl border border-[#1A2A20] bg-none cursor-pointer p-1" />
                      <div className="flex-1 h-12 rounded-xl border border-white/10 flex items-center px-4" style={{ backgroundColor: `${themeColor}22` }}>
                        <span className="font-semibold text-sm" style={{ color: themeColor }}>{themeColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={back} className="flex-initial bg-white/5 text-zinc-200 border border-white/10 rounded-xl px-5 py-3.5 text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-white/10">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={next} className="flex-1 bg-[#19c37d] text-black border-none rounded-xl p-4 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#15aa6d]">
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 grid place-items-center border border-emerald-500/20">
                    <Mail size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold m-0 text-white">Contact Details</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 m-0">Who should we contact when approved?</p>
                  </div>
                </div>
                <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
                  <Clock size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-300 m-0 leading-relaxed">Your request will be reviewed by our team within <strong className="text-amber-400">24–48 hours</strong>. You will receive an email with your admin credentials once approved.</p>
                </div>
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Your Full Name</label>
                    <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="e.g. Dr. John Kamau" className="w-full bg-[#06080A] border border-[#1A2A20] rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none focus:border-[#19c37d]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Official Email Address</label>
                    <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@youruni.ac.ke" className="w-full bg-[#06080A] border border-[#1A2A20] rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none focus:border-[#19c37d]" />
                  </div>
                </div>
                {error && <p className="text-rose-400 text-xs sm:text-sm mt-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}
                <div className="flex gap-3 mt-6">
                  <button onClick={back} disabled={busy} className="flex-initial bg-white/5 text-zinc-200 border border-white/10 rounded-xl px-5 py-3.5 text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-white/10">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={handleStep2} disabled={busy} className="flex-1 bg-[#19c37d] text-black border-none rounded-xl p-4 text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#15aa6d] disabled:opacity-70">
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <>Submit Request <ArrowRight size={18} /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 grid place-items-center mx-auto mb-6">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-extrabold m-0 mb-3 text-white">Request Submitted!</h2>
                <p className="text-sm sm:text-base text-zinc-400 mb-2 leading-relaxed">
                  Your application for <strong className="text-white">{name}</strong> has been received.
                </p>
                <p className="text-xs sm:text-sm text-zinc-500 mb-8 leading-relaxed">
                  Our team will review your request and send admin credentials to <strong className="text-zinc-300">{adminEmail}</strong> within <strong className="text-amber-400">24–48 hours</strong>.
                </p>
                <Link href="/" className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-200 rounded-xl px-6 py-3.5 text-sm font-semibold no-underline border border-white/10 transition-colors">
                  Back to Home
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {step < 3 && (
          <p className="text-center text-xs sm:text-sm text-zinc-500 mt-6">
            Already registered? <Link href="/login" className="text-[#19c37d] no-underline hover:underline">Log in to your workspace.</Link>
          </p>
        )}
      </div>

    </main>
  );
}
