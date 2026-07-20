"use client";

import { SpatialBackground } from "./landing/spatial-background";
import { LandingNav } from "./landing/landing-nav";
import { HeroSection } from "./landing/hero-section";
import { TrustModules } from "./landing/trust-modules";
import { StatWidgets } from "./landing/stat-widgets";
import { UniversityShowcase } from "./landing/university-showcase";

export function WelcomePage() {
  return (
    <main className="kili-os">
      <SpatialBackground />

      <div className="relative z-10 px-4">
        <LandingNav />
      </div>

      <HeroSection />
      <TrustModules />
      <StatWidgets />
      <UniversityShowcase />
    </main>
  );
}
