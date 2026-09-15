import { PublicNavbar } from "../../components/public-navbar";
import { PublicFooter } from "../../components/public-footer";

export default function PrivacyPage() {
  return (
    <main className="bg-aurora min-h-screen text-white relative overflow-x-hidden">
      <div className="absolute -top-[10%] left-[30%] w-[100vw] h-[100vw] bg-[radial-gradient(circle,rgba(25,195,125,0.06)_0%,rgba(0,0,0,0)_60%)] z-0 pointer-events-none" />
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8">
        <PublicNavbar />
        
        <div className="max-w-3xl mx-auto my-8 sm:my-16 bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.02)] rounded-3xl p-5 sm:p-12">
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mb-6 sm:mb-10">Last updated: July 2026</p>

          <div className="text-zinc-200 leading-relaxed text-xs sm:text-base flex flex-col gap-4 sm:gap-6">
            <p className="m-0">
              At KiliGuide, your privacy is our absolute priority. We built this platform for DeKUT students with strict data protection mechanisms baked into the core architecture. This policy outlines how we handle your data.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">1. Data Isolation & Security</h2>
            <p className="m-0">
              We utilize PostgreSQL Row Level Security (RLS) policies. This ensures that every piece of data you generate—from chat logs to uploaded timetables—is cryptographically isolated to your specific user ID. No other user, and not even application-level bugs, can expose your data to unauthorized parties.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">2. Artificial Intelligence & Training</h2>
            <p className="m-0">
              KiliGuide uses state-of-the-art language models (LLMs) to answer your questions. <strong className="text-white font-bold">We do not use your personal data to train these models.</strong> Your chat history and custom instructions are sent to the AI strictly for the duration of generating a single response, after which they are discarded by the AI provider.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">3. Data Deletion</h2>
            <p className="m-0">
              You maintain absolute control over your data. Inside the KiliGuide settings panel, you can trigger a permanent hard-deletion of your chat history and timetable data. When you click delete, the data is instantly wiped from our databases via SQL `DELETE` commands. We do not soft-delete or retain copies.
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">4. Information We Collect</h2>
            <p className="m-0">
              We only collect information strictly necessary to provide the service:
              <br/>- Your email address (for authentication via Supabase Auth)
              <br/>- Your explicitly provided "Custom Instructions"
              <br/>- Chat interactions (so you can view your history)
              <br/>- Timetable documents you explicitly choose to upload
            </p>

            <h2 className="text-base sm:text-xl font-bold text-white mt-3 sm:mt-5 mb-0">5. Contact Us</h2>
            <p className="m-0">
              If you have any questions regarding how your data is handled, or wish to exercise your data rights, please contact the DeKUT administration or the KiliGuide maintainers.
            </p>
          </div>
        </div>

        <PublicFooter />
      </div>
    </main>
  );
}
