"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Layers, Lock, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSpotlight } from "./use-spotlight";

const MODULES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: BadgeCheck,
    title: "Verified Sources",
    desc: "Every answer is drawn only from official university documents and records.",
  },
  {
    icon: Layers,
    title: "Source-Grounded AI",
    desc: "Responses cite the exact handbook, notice or calendar they came from.",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    desc: "Your questions and data stay protected — never sold, never exposed.",
  },
  {
    icon: RefreshCw,
    title: "Always Updated",
    desc: "Knowledge syncs continuously with the latest official information.",
  },
];

export function TrustModules() {
  const onMove = useSpotlight();

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-soft">
          Built on trust
        </span>
        <h2 className="mt-4 text-balance text-[clamp(30px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
          Intelligence you can rely on.
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-white/50">
          KiliGuide is engineered like a system, not a chatbot — grounded, private, and
          precise by design.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m, i) => (
          <motion.article
            key={m.title}
            onMouseMove={onMove}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="kili-material kili-spot flex flex-col p-6"
          >
            <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-emerald/12 ring-1 ring-emerald/25">
              <m.icon size={19} className="text-emerald-soft" />
            </span>
            <h3 className="text-[15.5px] font-semibold text-white">{m.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{m.desc}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
