"use client";

import { useCallback } from "react";

/**
 * Returns an onMouseMove handler that writes the cursor position into
 * CSS custom properties (--mx / --my) so a radial "spotlight" gradient
 * can follow the cursor across a `.kili-spot` surface.
 */
export function useSpotlight() {
  return useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);
}
