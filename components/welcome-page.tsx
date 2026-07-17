import Link from "next/link";
import { ArrowRight, BellRing, BookOpenCheck, CalendarClock, CheckCircle2, ChevronRight, FileSearch, GraduationCap, Languages, ShieldCheck, TicketCheck } from "lucide-react";

const services = [
  { icon: FileSearch, title: "Ask trusted questions", description: "Get answers from official DeKUT documents, with sources shown for every response." },
  { icon: CalendarClock, title: "Stay ahead of deadlines", description: "Turn your timetable and university dates into personal reminders." },
  { icon: TicketCheck, title: "Reach the right office", description: "Send and track support requests to Finance, ICT, Accommodation, Registrar, and more." },
];

export function WelcomePage() {
  return <main className="min-h-screen overflow-hidden bg-[#f7f9fd] text-ink">
    <div className="absolute inset-x-0 top-0 -z-10 h-[590px] bg-[radial-gradient(circle_at_15%_12%,rgba(111,166,255,.32),transparent_28%),radial-gradient(circle_at_83%_13%,rgba(199,255,98,.20),transparent_24%),linear-gradient(150deg,#f7faff_0%,#e8f1ff_52%,#f9fbff_100%)]" />
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <Link href="/" className="flex items-center gap-3" aria-label="KiliGuide home">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-lg font-black text-lime shadow-soft">K</span>
        <span><strong className="block text-lg leading-5 tracking-tight">KiliGuide</strong><small className="block text-xs font-medium text-slate-500">by KiliMind AI · DeKUT</small></span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/login" className="hidden text-sm font-bold text-ink hover:text-blue-700 sm:block">Sign in</Link>
        <Link href="/login" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5">Get started <ArrowRight className="ml-1 inline" size={15} /></Link>
      </div>
    </header>

    <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-28">
      <div className="max-w-2xl">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-700"><GraduationCap size={15} /> YOUR DEKUT CAMPUS COMPANION</p>
        <h1 className="text-4xl font-black leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl">Campus answers, <span className="text-blue-600">without the runaround.</span></h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">KiliGuide helps Dedan Kimathi University students and staff find verified information, keep up with deadlines, and reach the right university office.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-bold text-white shadow-soft transition hover:-translate-y-0.5">Sign in to KiliGuide <ArrowRight size={18} /></Link>
          <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-6 py-3.5 font-bold text-ink hover:border-blue-300">Explore the platform <ChevronRight size={18} /></a>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={17} className="text-blue-600" /> Secure university access · English and Kiswahili</p>
      </div>

      <div className="relative mx-auto w-full max-w-lg">
        <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-blue-300/20 blur-2xl" />
        <div className="rounded-[1.7rem] border border-white/90 bg-white p-4 shadow-[0_28px_80px_rgba(24,61,125,.16)] sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-ink font-black text-lime">K</span><span className="text-sm font-bold">Ask KiliGuide</span></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Official sources only</span></div>
          <div className="mt-5 rounded-2xl bg-sky p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">You asked</p><p className="mt-1 font-semibold">“When is the fee payment deadline?”</p></div>
          <div className="mt-3 rounded-2xl border border-blue-100 p-4"><div className="flex items-start gap-3"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink text-xs font-black text-lime">K</span><div><p className="font-semibold leading-6">Here is the relevant guidance from the Finance notice.</p><div className="mt-3 flex items-center gap-2"><span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">Finance notice</span><span className="text-[11px] font-bold text-slate-400">Source cited</span></div></div></div></div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-400"><FileSearch size={17} /> Ask about registration, accommodation, exams…</div>
        </div>
        <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-soft"><span className="grid h-9 w-9 place-items-center rounded-xl bg-lime"><BellRing size={18} /></span><span><b className="block text-sm">Deadline reminder</b><small className="text-xs text-slate-500">Fee payment · Tomorrow</small></span></div>
      </div>
    </section>

    <section id="how-it-works" className="border-y border-blue-100 bg-white py-16 sm:py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><div className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[.14em] text-blue-600">Built for campus life</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Everything you need, connected to the university.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{services.map(({icon:Icon,title,description})=><article key={title} className="rounded-2xl border border-slate-100 bg-[#fbfcff] p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700"><Icon size={22}/></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div></div></section>

    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="grid gap-7 rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-lime"><BookOpenCheck size={19}/><span className="text-sm font-bold">SOURCE-GROUNDED AI</span></div><h2 className="mt-3 text-3xl font-black tracking-tight">A safer way to get campus information.</h2><p className="mt-3 max-w-2xl leading-7 text-blue-100">KiliGuide shows the document behind its answer. When the official knowledge base does not contain an answer, it will tell you plainly.</p></div><Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-6 py-3.5 font-bold text-ink hover:bg-[#d5ff8c]">Access KiliGuide <ArrowRight size={18}/></Link></div><p className="mt-7 flex items-center justify-center gap-2 text-center text-xs text-slate-500"><CheckCircle2 size={14} className="text-emerald-600"/> For the DeKUT community · Powered by KiliMind AI <Languages size={14}/></p></section>
  </main>;
}
