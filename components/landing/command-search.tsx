"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpRight, CornerDownLeft } from "lucide-react";

const SUGGESTIONS = [
  "Exam timetable",
  "Hostel application",
  "Fee structure",
  "Academic calendar",
  "Where is the Finance Office?",
];

export function CommandSearch() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => router.push("/login");

  return (
    <div className="w-full max-w-2xl">
      <motion.div
        className="kili-material relative flex items-center gap-3 rounded-2xl px-4 py-2.5"
        animate={{
          boxShadow: focused
            ? "0 1px 0 rgba(255,255,255,0.12) inset, 0 0 0 1px rgba(16,185,129,0.35), 0 0 60px -10px rgba(16,185,129,0.4)"
            : "0 1px 0 rgba(255,255,255,0.09) inset, 0 0 0 1px rgba(0,0,0,0.35), 0 30px 80px -30px rgba(0,0,0,0.85)",
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Search
          size={19}
          className={focused ? "text-emerald-soft transition-colors" : "text-white/40 transition-colors"}
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submit();
          }}
          placeholder="Ask anything about your university…"
          aria-label="Ask KiliGuide anything about your university"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
        />
        <kbd className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[10px] font-medium text-white/40 sm:flex">
          <CornerDownLeft size={11} /> Enter
        </kbd>
        <button
          type="button"
          onClick={submit}
          aria-label="Ask KiliGuide"
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-emerald text-black shadow-[0_8px_22px_-6px_rgba(16,185,129,0.7)] transition-transform duration-300 hover:scale-105"
        >
          <ArrowUpRight size={18} />
        </button>
      </motion.div>

      {/* Floating suggestion pills */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-white/40">Try</span>
        {SUGGESTIONS.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald/40 hover:bg-emerald/10 hover:text-emerald-soft"
            >
              {s}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
