"use client";

import { motion } from "framer-motion";
import { CommandSearch } from "./command-search";
import { SpatialWorkspace } from "./spatial-workspace";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  return (
    <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pt-20 pb-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-28">
      {/* Left — editorial hero copy */}
      <div className="flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-8 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12px] font-medium text-white/70"
        >
          <span className="kili-pulse" />
          The AI Operating System for Universities
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease }}
          className="text-balance text-[clamp(44px,6vw,72px)] font-semibold leading-[1.02] tracking-[-0.04em] text-white"
        >
          The intelligent layer
          <br />
          for university life.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease }}
          className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-white/55"
        >
          KiliGuide unifies documents, notices, timetables and services into one calm,
          source-grounded intelligence — so every answer you get is accurate, cited, and
          instant.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28, ease }}
          className="mt-10"
        >
          <CommandSearch />
        </motion.div>
      </div>

      {/* Right — spatial workspace */}
      <div className="relative">
        <SpatialWorkspace />
      </div>
    </section>
  );
}
