"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Layered depth background for the KiliGuide OS:
 * fog + soft radial lighting, an almost-invisible grid, animated grain,
 * and slow floating light particles. Purely decorative.
 */
export function SpatialBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: `${(i * 53) % 100}%`,
        top: `${(i * 37 + 8) % 100}%`,
        size: 1.5 + ((i * 7) % 3),
        duration: 14 + ((i * 5) % 12),
        delay: (i % 6) * -2.5,
        drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 6),
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none">
      <div className="kili-fog" />
      <div className="kili-grid" />

      {/* Floating ambient light particles */}
      <div className="fixed inset-0 z-[1] overflow-hidden">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: "rgba(52,211,153,0.7)",
              boxShadow: "0 0 8px 1px rgba(16,185,129,0.45)",
            }}
            animate={{
              y: [0, p.drift, 0],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="kili-grain" />
    </div>
  );
}
