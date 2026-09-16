"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";

export default function RegisterInstitutionPage() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [notes, setNotes] = useState("");
  
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);
    setError("");

    // Clean domain (e.g. https://www.dkut.ac.ke/ -> dkut.ac.ke)
    let cleanDomain = domain.toLowerCase().trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    const { data, error: err } = await supabase.from("institution_requests").insert([{
      name: name.trim(),
      domain: cleanDomain,
      admin_name: adminName.trim(),
      admin_email: adminEmail.trim().toLowerCase(),
      notes: notes.trim() || null,
      status: "pending"
    }]).select("id").single();

    setBusy(false);

    if (err) {
      setError(err.message.includes("duplicate") ? "A request for this domain or email already exists." : err.message);
      return;
    }

    setSubmitted(true);
  };

  return (
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden flex flex-col justify-between">
      <PublicNavbar />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-12 sm:py-16 w-full flex-1 flex flex-col justify-center">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white no-underline mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to KiliGuide Home
        </Link>

        {submitted ? (
          <div className="bg-zinc-950/80 backdrop-blur-3xl border border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 grid place-items-center mx-auto mb-6 text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Onboarding Request Submitted</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Thank you! Your request to register <strong className="text-emerald-400">{name}</strong> has been received. Our Superadmin team will review your domain (<span className="text-zinc-200">{domain}</span>) and approve your institution administrator access.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login" className="bg-[#19c37d] text-black font-extrabold px-6 py-3.5 rounded-2xl text-sm no-underline hover:bg-emerald-400 transition-all shadow-lg">
                Proceed to Sign In
              </Link>
              <Link href="/" className="bg-white/5 border border-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl text-sm no-underline hover:bg-white/10 transition-all">
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950/70 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_0_32px_rgba(255,255,255,0.02)]">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#19c37d]/10 border border-[#19c37d]/20 grid place-items-center text-[#19c37d]">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white m-0">Register Your Institution</h1>
                <p className="text-xs sm:text-sm text-zinc-400 m-0 mt-0.5">Onboard your university to KiliGuide multi-tenant AI platform.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
              
              {/* Institution Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Institution / University Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Strathmore University"
                  className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d] focus:ring-1 focus:ring-[#19c37d]/30"
                />
              </div>

              {/* Official Domain */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Official Domain</label>
                <input
                  required
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g. strathmore.edu"
                  className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d] focus:ring-1 focus:ring-[#19c37d]/30"
                />
                <p className="text-[11px] text-zinc-500 mt-1 pl-1">Used to auto-detect and segregate students registering with `@yourdomain` email addresses.</p>
              </div>

              {/* Administrator Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Admin Full Name</label>
                  <input
                    required
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Admin Email Address</label>
                  <input
                    required
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="jane.doe@strathmore.edu"
                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d]"
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 pl-1">Additional Verification Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Provide any additional contact info or verification details..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl text-white p-3.5 sm:p-4 text-sm outline-none transition-all focus:border-[#19c37d] resize-none"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-400 text-xs sm:text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                disabled={busy}
                className="w-full bg-gradient-to-r from-[#19c37d] to-[#14a367] text-black font-extrabold border-none rounded-xl p-4 text-sm sm:text-base mt-2 cursor-pointer transition-all hover:shadow-[0_8px_24px_rgba(25,195,125,0.3)] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : "Submit Institution Onboarding Request"}
              </button>
            </form>

            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3 items-center">
              <ShieldCheck size={20} className="text-[#19c37d] flex-shrink-0" />
              <p className="text-xs text-zinc-400 m-0 leading-relaxed">
                Superadmin approval elevates your account to Institution Administrator, granting access to manage your campus documents & RAG knowledge base.
              </p>
            </div>
          </div>
        )}
      </div>

      <PublicFooter />
    </main>
  );
}
