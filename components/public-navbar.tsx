"use client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { InstallButton } from "./install-button";

export function PublicNavbar() {
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { label: "Home", href: "/" },
    { label: "Vision", href: "/vision" },
    { label: "Technology", href: "/technology" },
    { label: "About", href: "/about" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ];

  return (
    <header className="relative z-[100] flex h-16 sm:h-20 w-full items-center justify-between px-4 sm:px-8">
      
      {/* Logo */}
      <div className="flex flex-shrink-0 items-center min-w-0">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 text-inherit no-underline z-10">
          <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-[#0B0F14] border border-[#1A2A20] flex-shrink-0 overflow-hidden shadow-md">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover transform scale-125" />
          </span>
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-bold tracking-tight m-0 leading-none text-white whitespace-nowrap">KiliGuide</h1>
            <span className="text-[10px] sm:text-xs text-zinc-400 font-medium whitespace-nowrap mt-0.5">Smarter Campus.</span>
          </div>
        </Link>
      </div>

      {/* Apple Vision Pro Style Floating Tab Bar (Desktop) */}
      <div className="hidden lg:flex flex-initial justify-center z-20">
        <nav 
          onMouseLeave={() => setHoveredTab(null)}
          className="flex items-center gap-1 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-2xl"
        >
        {tabs.map(item => {
          const isActive = pathname === item.href;
          const isHovered = hoveredTab === item.href;
          
          return (
            <Link 
              key={item.href}
              href={item.href} 
              onMouseEnter={() => setHoveredTab(item.href)}
              className={`relative px-4 py-2 text-xs font-semibold no-underline transition-colors duration-300 z-10 ${
                isActive ? "text-black" : (isHovered ? "text-white" : "text-zinc-400")
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-[#19c37d] rounded-full -z-10 shadow-[0_4px_12px_rgba(25,195,125,0.3)]"
                />
              )}
              {!isActive && isHovered && (
                <motion.div
                  layoutId="hover-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-white/10 rounded-full -z-10"
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3 z-10 min-w-0">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all shadow-sm"
        >
          Explore
          <motion.div animate={{ rotate: mobileMenuOpen ? 180 : 0 }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </button>

        {/* Desktop Sign In button */}
        <Link 
          href="/login" 
          className="hidden sm:inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-black border-none rounded-full px-5 py-2 text-xs sm:text-sm font-bold no-underline transition-all transform hover:scale-105 shadow-[0_4px_14px_rgba(255,255,255,0.2)] whitespace-nowrap"
        >
          Sign In <ArrowRight size={14} />
        </Link>
      </div>

      {/* Mobile Glassmorphic Dropdown Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-16 sm:top-20 right-4 sm:right-8 w-[calc(100vw-32px)] max-w-xs bg-zinc-950/80 backdrop-blur-3xl border border-white/15 rounded-2xl p-3 flex flex-col gap-1 shadow-2xl z-[90]"
        >
          <div className="lg:hidden flex flex-col gap-1">
            {tabs.map(item => (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)} 
                className="px-4 py-2.5 text-zinc-200 hover:text-white no-underline text-sm font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px bg-white/10 my-1" />
          </div>
          
          <InstallButton className="px-4 py-2.5 text-emerald-400 hover:bg-emerald-500/10 text-sm font-semibold rounded-xl text-left transition-colors" />
          
          <Link 
            href="/register-institution" 
            onClick={() => setMobileMenuOpen(false)} 
            className="px-4 py-2.5 text-[#19c37d] hover:bg-[#19c37d]/10 no-underline text-sm font-semibold rounded-xl transition-colors"
          >
            Register Institution
          </Link>

          <Link 
            href="/login" 
            onClick={() => setMobileMenuOpen(false)} 
            className="mt-1 bg-white text-black hover:bg-zinc-100 px-4 py-3 no-underline text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
            Sign In <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}

    </header>
  );
}
