import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";

export default function CookiePolicyPage() {
  return (
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden">
      <div className="absolute -top-[10%] left-[30%] w-[100vw] h-[100vw] bg-[radial-gradient(circle,rgba(25,195,125,0.06)_0%,rgba(0,0,0,0)_60%)] z-0 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8">
        <PublicNavbar />
        
        <div className="max-w-3xl mx-auto my-8 sm:my-16 bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.02)] rounded-3xl p-5 sm:p-12">
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight">Cookie Policy</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mb-6 sm:mb-10">Last updated: September 2026</p>

          <div className="text-zinc-200 leading-relaxed text-xs sm:text-base flex flex-col gap-4 sm:gap-6">
            <p className="m-0">
              This Cookie Policy explains how KiliGuide ("we", "us", or "our") uses cookies and similar storage technologies when you visit or interact with our campus AI platform.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">1. What Are Cookies & Local Storage?</h2>
            <p className="m-0">
              Cookies and web local storage are small text files or data key-value pairs stored on your browser or device when you visit a website. They allow the application to remember your login session, security state, and personal preferences across page navigations.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">2. How We Use Cookies</h2>
            <p className="m-0">
              KiliGuide relies exclusively on essential cookies and local storage items required for proper functioning of the service:
              <br/>- <strong className="text-white">Authentication & Security Tokens (Supabase):</strong> Keeps you securely logged into your student or administrator account without prompting for password re-entry on every request.
              <br/>- <strong className="text-white">Session Management:</strong> Stores transient state required during chat interactions and timetable processing.
              <br/>- <strong className="text-white">User Preferences & Consent:</strong> Remembers your dark mode preferences, PWA installation prompts, and cookie consent choice (`kiliguide_cookie_consent`).
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">3. Third-Party Tracking & Advertising</h2>
            <p className="m-0">
              <strong className="text-white">We do NOT use third-party tracking, advertising cookies, or cross-site behavioral analytics.</strong> Your usage of KiliGuide remains private to your university account.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">4. Managing & Clearing Storage</h2>
            <p className="m-0">
              You can control or clear cookies and local storage at any time through your browser settings. Note that disabling essential authentication cookies will prevent you from signing in to KiliGuide.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">5. Updates to This Policy</h2>
            <p className="m-0">
              We may update this Cookie Policy periodically to reflect technological or security enhancements. Any changes will be posted on this page with an updated timestamp.
            </p>
          </div>
        </div>

        <PublicFooter />
      </div>
    </main>
  );
}
