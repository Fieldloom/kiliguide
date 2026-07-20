"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Sparkles,
  FileText,
  CalendarDays,
  Bell,
  BadgeCheck,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

/* ── Individual material widgets ──────────────────────────── */

function AiConversationWidget() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const sources = [
    { label: "Registrar Office", delay: 0.5 },
    { label: "Academic Calendar", delay: 0.8 },
    { label: "Student Handbook", delay: 1.1 },
  ];

  return (
    <div ref={ref} className="kili-material w-full overflow-hidden p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald/15 ring-1 ring-emerald/25">
          <Sparkles size={14} className="text-emerald-soft" />
        </span>
        <span className="text-[13px] font-semibold text-white">KiliMind Assistant</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-white/45">
          <span className="kili-pulse" /> Live
        </span>
      </div>

      {/* User question */}
      <div className="mb-3 flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald/15 px-3.5 py-2.5 text-[13px] leading-relaxed text-white ring-1 ring-emerald/20">
          When does semester registration begin?
        </p>
      </div>

      {/* Searching sources */}
      <div className="mb-3 flex gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
          <Sparkles size={13} className="text-emerald-soft" />
        </span>
        <div className="flex-1">
          <p className="mb-2 text-[12px] text-white/50">Searching official university sources…</p>
          <div className="flex flex-col gap-1.5">
            {sources.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 text-[12px] text-white/75"
              >
                <BadgeCheck size={14} className="text-emerald-soft" />
                {s.label}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Grounded answer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5"
      >
        <p className="text-[13px] leading-relaxed text-white/85">
          Semester registration opens{" "}
          <span className="font-semibold text-emerald-soft">Monday, September 2nd</span> and closes on
          the 13th. Clear any outstanding fee balance before you register.
        </p>
        <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-2.5 text-[11px] text-white/45">
          <ShieldCheck size={13} className="text-emerald-soft" />
          Grounded in 3 official sources
          <span className="ml-auto font-medium text-emerald-soft">98% confidence</span>
        </div>
      </motion.div>
    </div>
  );
}

function NoticeWidget() {
  return (
    <div className="kili-material w-full p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <FileText size={14} className="text-emerald-soft" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          University Notice
        </span>
      </div>
      <p className="mb-1 text-[13px] font-semibold text-white">Graduation List Released</p>
      <p className="text-[12px] leading-relaxed text-white/55">
        Provisional graduands for the 2025 ceremony are now published on the portal.
      </p>
    </div>
  );
}

function TimetableWidget() {
  const rows = [
    { time: "08:00", title: "Data Structures", room: "TB-204" },
    { time: "11:00", title: "Linear Algebra", room: "LH-1" },
    { time: "14:00", title: "Systems Design", room: "Lab-3" },
  ];
  return (
    <div className="kili-material w-full p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays size={14} className="text-emerald-soft" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Today&apos;s Timetable
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.time} className="flex items-center gap-3">
            <span className="w-10 text-[11px] font-medium tabular-nums text-emerald-soft">{r.time}</span>
            <span className="flex-1 truncate text-[12.5px] text-white/85">{r.title}</span>
            <span className="text-[11px] text-white/40">{r.room}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsWidget() {
  return (
    <div className="kili-material flex w-full items-center gap-3 p-3.5">
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-emerald/15 ring-1 ring-emerald/25">
        <Bell size={15} className="text-emerald-soft" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-medium text-white">Fee deadline in 3 days</p>
        <p className="truncate text-[11px] text-white/45">Finance Office · just now</p>
      </div>
    </div>
  );
}

function KnowledgeWidget() {
  const items = ["Handbook", "Calendar", "Fees", "Hostels", "Exams"];
  return (
    <div className="kili-material w-full p-4">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen size={14} className="text-emerald-soft" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
          Knowledge Sources
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Spatial arrangement ──────────────────────────────────── */

export function SpatialWorkspace() {
  return (
    <div className="relative w-full">
      {/* Desktop: floating, gently overlapping, perspective cluster */}
      <div
        className="relative hidden h-[600px] w-full lg:block"
        style={{ perspective: "2000px" }}
      >
        <div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", transform: "rotateY(-14deg) rotateX(6deg)" }}
        >
          {/* Timetable — back, upper right */}
          <motion.div
            className="kili-float-delay absolute right-0 top-0 z-10 w-[248px]"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: "translateZ(20px)" }}
          >
            <TimetableWidget />
          </motion.div>

          {/* Primary AI conversation — front plane, left */}
          <motion.div
            className="kili-float absolute left-0 top-[52px] z-30 w-[332px]"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: "translateZ(100px)" }}
          >
            <AiConversationWidget />
          </motion.div>

          {/* Notice — lower right */}
          <motion.div
            className="kili-float-slow absolute right-0 bottom-[64px] z-20 w-[262px]"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: "translateZ(60px)" }}
          >
            <NoticeWidget />
          </motion.div>

          {/* Notification — floating pill, front, lower left */}
          <motion.div
            className="kili-float absolute bottom-0 left-[24px] z-40 w-[248px]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: "translateZ(130px)" }}
          >
            <NotificationsWidget />
          </motion.div>
        </div>
      </div>

      {/* Mobile / tablet: clean stacked deck */}
      <div className="flex flex-col gap-4 lg:hidden">
        <AiConversationWidget />
        <div className="grid gap-4 sm:grid-cols-2">
          <TimetableWidget />
          <NoticeWidget />
        </div>
        <NotificationsWidget />
        <KnowledgeWidget />
      </div>
    </div>
  );
}
