"use client";

import { motion, useInView, useMotionValue, animate, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { Users, Target, Clock, LayoutGrid } from "lucide-react";
import { useSpotlight } from "./use-spotlight";

/* Count-up number that runs once when scrolled into view */
function CountUp({
  to,
  suffix = "",
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
  );

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
      return controls.stop;
    }
  }, [inView, to, count]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

function StatShell({
  children,
  visual,
  value,
  label,
  delay,
}: {
  children?: React.ReactNode;
  visual: React.ReactNode;
  value: React.ReactNode;
  label: string;
  delay: number;
}) {
  const onMove = useSpotlight();
  return (
    <motion.div
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="kili-material kili-spot flex flex-col justify-between gap-6 p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[34px] font-semibold leading-none tracking-tight text-white">
            {value}
          </div>
          <div className="mt-2 text-[13px] text-white/45">{label}</div>
        </div>
        {visual}
      </div>
      {children}
    </motion.div>
  );
}

/* Animated upward trend line */
function TrendLine() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <svg ref={ref} viewBox="0 0 120 44" className="h-11 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(16,185,129,0.28)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M2 38 L22 30 L42 33 L62 20 L82 24 L102 10 L118 4"
        fill="none"
        stroke="#34d399"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M2 38 L22 30 L42 33 L62 20 L82 24 L102 10 L118 4 L118 44 L2 44 Z"
        fill="url(#trendFill)"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.6 }}
      />
    </svg>
  );
}

/* Circular confidence ring */
function ConfidenceRing({ percent }: { percent: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const r = 20;
  const circ = 2 * Math.PI * r;
  return (
    <svg ref={ref} viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <motion.circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="#34d399"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={inView ? { strokeDashoffset: circ - (circ * percent) / 100 } : {}}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* Availability pulse */
function AvailabilityPulse() {
  return (
    <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-emerald/12 ring-1 ring-emerald/25">
      <Clock size={18} className="text-emerald-soft" />
      <motion.span
        className="absolute inset-0 rounded-2xl ring-1 ring-emerald/40"
        animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
        transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
      />
    </span>
  );
}

export function StatWidgets() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatShell
          delay={0}
          label="Students helped"
          value={<CountUp to={15000} suffix="+" />}
          visual={
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald/12 ring-1 ring-emerald/25">
              <Users size={18} className="text-emerald-soft" />
            </span>
          }
        >
          <TrendLine />
        </StatShell>

        <StatShell
          delay={0.08}
          label="Answer accuracy"
          value={<CountUp to={98} suffix="%" />}
          visual={<ConfidenceRing percent={98} />}
        >
          <div className="flex items-center gap-2 text-[12px] text-white/45">
            <Target size={13} className="text-emerald-soft" />
            Source-grounded confidence
          </div>
        </StatShell>

        <StatShell
          delay={0.16}
          label="Always available"
          value="24/7"
          visual={<AvailabilityPulse />}
        >
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <motion.span
                key={i}
                className="h-6 flex-1 rounded-sm bg-emerald/25"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </StatShell>

        <StatShell
          delay={0.24}
          label="Campus services"
          value={<CountUp to={12} suffix="+" />}
          visual={
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald/12 ring-1 ring-emerald/25">
              <LayoutGrid size={18} className="text-emerald-soft" />
            </span>
          }
        >
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="aspect-square rounded-md border border-white/8 bg-white/[0.03]"
              />
            ))}
          </div>
        </StatShell>
      </div>
    </section>
  );
}
