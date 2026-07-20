"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { useSpotlight } from "./use-spotlight";

export function UniversityShowcase() {
  const onMove = useSpotlight();

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
      {/* Institutional showcase */}
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Powering campuses
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
        <motion.div
          onMouseMove={onMove}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="kili-material kili-spot flex items-center gap-6 p-8"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Dedan_Kimathi_University_of_Technology_logo.png/220px-Dedan_Kimathi_University_of_Technology_logo.png"
            alt="Dedan Kimathi University of Technology crest"
            className="h-16 w-16 flex-shrink-0 rounded-full bg-white object-contain p-1.5"
          />
          <div>
            <p className="text-[13px] text-white/45">Official campus companion for</p>
            <h3 className="mt-1 text-[20px] font-semibold leading-snug tracking-tight text-white">
              Dedan Kimathi University of Technology
            </h3>
          </div>
        </motion.div>

        <motion.div
          onMouseMove={onMove}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="kili-material kili-spot flex items-center gap-4 p-8"
        >
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border border-dashed border-white/15">
            <Plus size={18} className="text-white/50" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-white">More universities</h3>
            <p className="mt-1 text-[13px] text-white/45">Onboarding across the region soon.</p>
          </div>
        </motion.div>
      </div>

      {/* Final CTA band */}
      <motion.div
        onMouseMove={onMove}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="kili-material kili-spot relative mt-4 overflow-hidden px-8 py-16 text-center"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(16,185,129,0.16), transparent 70%)",
          }}
        />
        <h2 className="relative text-balance text-[clamp(30px,4.5vw,52px)] font-semibold leading-[1.04] tracking-[-0.035em] text-white">
          The future of university
          <br className="hidden sm:block" /> technology, today.
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/55">
          Step into a calmer, smarter way to navigate campus life — grounded in truth,
          designed for you.
        </p>
        <Link
          href="/login"
          className="group relative mt-9 inline-flex items-center gap-2 rounded-full bg-emerald px-7 py-3.5 text-[14px] font-semibold text-black shadow-[0_16px_40px_-10px_rgba(16,185,129,0.7)] transition-transform duration-300 hover:-translate-y-0.5"
        >
          Enter KiliGuide
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* Footer */}
      <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 text-[12.5px] text-white/40 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
            <img src="/logo.png" alt="" className="h-full w-full scale-110 object-cover" />
          </span>
          <span className="text-white/60">KiliGuide</span>
          <span>· Smarter campus. Better tomorrow.</span>
        </div>
        <span>© {new Date().getFullYear()} KiliGuide. All rights reserved.</span>
      </footer>
    </section>
  );
}
