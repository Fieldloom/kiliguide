"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/", active: true },
  { label: "Chats", href: "/login" },
  { label: "Documents", href: "/login" },
  { label: "Timetable", href: "/login" },
  { label: "Notices", href: "/login" },
  { label: "Support", href: "/login" },
];

export function LandingNav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 z-50 mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 kili-material"
    >
      <Link href="/" className="flex items-center gap-3" aria-label="KiliGuide home">
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <img
            src="/logo.png"
            alt=""
            className="h-full w-full scale-110 object-cover"
          />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-white">KiliGuide</span>
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-white/45">
            University Intelligence OS
          </span>
        </span>
      </Link>

      <nav className="hidden items-center gap-8 text-[13px] font-medium lg:flex" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="kili-navlink"
            data-active={link.active ? "true" : undefined}
            aria-current={link.active ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="hidden items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[13px] font-medium text-white/85 transition-colors duration-300 hover:border-emerald/40 hover:text-white sm:flex"
        >
          <Sparkles size={14} className="text-emerald-soft" />
          Ask KiliGuide
        </Link>
        <Link
          href="/login"
          className="group flex items-center gap-1.5 rounded-full bg-emerald px-4 py-2 text-[13px] font-semibold text-black shadow-[0_8px_24px_-6px_rgba(16,185,129,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
        >
          Sign In
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.header>
  );
}
