"use client";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-white/5 py-8 sm:py-10 mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0 text-zinc-400 text-xs sm:text-sm px-4 sm:px-8 text-center sm:text-left">
      <div>
        <h2 className="text-base sm:text-lg font-bold m-0 tracking-tight text-white">KiliGuide</h2>
        <span className="text-xs text-zinc-400 block mt-0.5">A product of KiliMind AI.</span>
        <div className="mt-1 text-zinc-500">© {new Date().getFullYear()} KiliGuide. Built for DeKUT.</div>
      </div>
      <div className="flex items-center gap-6">
        <Link href="/privacy" className="text-zinc-400 hover:text-white no-underline transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-zinc-400 hover:text-white no-underline transition-colors">
          Terms of Use
        </Link>
        <Link href="/cookies" className="text-zinc-400 hover:text-white no-underline transition-colors">
          Cookie Policy
        </Link>
      </div>
    </footer>
  );
}
