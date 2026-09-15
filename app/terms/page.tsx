import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";

export default function TermsPage() {
  return (
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden">
      <div className="absolute -top-[10%] left-[30%] w-[100vw] h-[100vw] bg-[radial-gradient(circle,rgba(25,195,125,0.06)_0%,rgba(0,0,0,0)_60%)] z-0 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8">
        <PublicNavbar />
        
        <div className="max-w-3xl mx-auto my-8 sm:my-16 bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.02)] rounded-3xl p-5 sm:p-12">
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight">Terms of Use</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mb-6 sm:mb-10">Last updated: July 2026</p>

          <div className="text-zinc-200 leading-relaxed text-xs sm:text-base flex flex-col gap-4 sm:gap-6">
            <p className="m-0">
              Welcome to KiliGuide. By accessing or using our platform, you agree to be bound by these Terms of Use. Please read them carefully.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">1. Acceptance of Terms</h2>
            <p className="m-0">
              By using KiliGuide, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use the service.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">2. Intended Use</h2>
            <p className="m-0">
              KiliGuide is an AI assistant designed to help DeKUT students navigate university resources, timetables, and policies. It is intended for informational and educational purposes only.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">3. Accuracy of Information</h2>
            <p className="m-0">
              While KiliGuide uses Retrieval-Augmented Generation (RAG) to cite official university documents, Artificial Intelligence can still occasionally produce inaccurate information ("hallucinations"). <strong className="text-white font-bold">You must independently verify critical information</strong> (such as exam dates or fee deadlines) through official university portals or administration offices. KiliGuide is not liable for academic or financial consequences resulting from reliance on the AI.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">4. Acceptable Conduct</h2>
            <p className="m-0">
              You agree not to use KiliGuide to:
              <br/>- Attempt to bypass or break the system's security (RLS policies).
              <br/>- Upload malicious files disguised as timetables or documents.
              <br/>- Harass, abuse, or engage in unethical behavior using the platform.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">5. Service Modifications</h2>
            <p className="m-0">
              We reserve the right to modify, suspend, or discontinue the service (or any part thereof) at any time, with or without notice to you. We shall not be liable to you or to any third party for any modification or suspension of the service.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">6. Governing Law</h2>
            <p className="m-0">
              These terms shall be governed and construed in accordance with the laws of Kenya, and any disputes will be subject to the exclusive jurisdiction of the courts of Kenya.
            </p>
          </div>
        </div>

        <PublicFooter />
      </div>
    </main>
  );
}
