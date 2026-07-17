import Link from "next/link";
import { ArrowUpRight, BellRing, BookOpenCheck, CalendarDays, Check, ChevronDown, FileSearch, GraduationCap, Languages, MapPin, MessageCircleMore, ShieldCheck, Sparkles, TicketCheck } from "lucide-react";

const outcomes = [
  ["01", "Ask", "Find a grounded answer from an official DeKUT source."],
  ["02", "Plan", "Keep your classes, notices, and university deadlines in view."],
  ["03", "Act", "Get support from the right office, without guessing where to go."],
];

export function WelcomePage() {
  return <main className="min-h-screen bg-[#f4f2ec] text-[#112956]">
    <section className="relative isolate overflow-hidden bg-[#0a1e46] text-white">
      <div className="absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(rgba(255,255,255,.075)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.075)_1px,transparent_1px)];[background-size:72px_72px]" />
      <div className="absolute -right-24 top-8 -z-10 h-80 w-80 rounded-full bg-[#3b6fe7] blur-[100px]" />
      <div className="absolute -bottom-36 left-[28%] -z-10 h-72 w-72 rounded-full bg-[#b7ff63]/20 blur-[90px]" />
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="KiliGuide home"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#c7ff62] text-lg font-black text-[#0a1e46]">K</span><span><strong className="block text-lg leading-5 tracking-tight">KiliGuide</strong><small className="block text-[11px] font-bold tracking-[.12em] text-blue-200">DEKUT · KILIMIND AI</small></span></Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-blue-100 lg:flex"><a href="#discover">Features</a><a href="#sources">Resources</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
        <Link href="/login" className="rounded-xl bg-[#c7ff62] px-4 py-2 text-sm font-bold text-[#0a1e46] transition hover:bg-white">Try KiliGuide <ArrowUpRight className="ml-1 inline" size={15}/></Link>
      </header>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-24">
        <div className="max-w-2xl">
          <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#c7ff62]"><Sparkles size={15}/> AI-powered. Campus-focused. Student-first.</p>
          <h1 className="text-5xl font-black leading-[.96] tracking-[-.055em] sm:text-6xl lg:text-7xl">The AI operating<br/>system for<br/><span className="text-[#c7ff62]">campus life.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-blue-100 sm:text-lg">Get answers from official university documents, track deadlines, and connect with the right office—all from one intelligent workspace.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/login" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#c7ff62] px-6 py-3.5 font-bold text-[#0a1e46] transition hover:bg-white">Enter KiliGuide <ArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={18}/></Link><a href="#discover" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3.5 font-bold text-white transition hover:bg-white/10">Discover the platform <ChevronDown size={17}/></a></div>
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-blue-200"><span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-[#c7ff62]"/> Official sources first</span><span className="flex items-center gap-1.5"><Languages size={15} className="text-[#c7ff62]"/> English & Kiswahili</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-md pb-6 pt-8 lg:pt-0">
          <p className="absolute left-0 top-0 text-[10px] font-bold uppercase tracking-[.18em] text-blue-200">Ask KiliGuide</p>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#12356f] p-5 shadow-[0_30px_70px_rgba(0,0,0,.28)] sm:p-6">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full border-[28px] border-[#c7ff62]/15" />
            <div className="relative flex items-center justify-between"><span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold">EN &nbsp;|&nbsp; SW</span><MapPin size={18} className="text-[#c7ff62]"/></div>
            <div className="relative mt-9 rounded-xl bg-[#2552a9] p-4"><p className="text-xs text-blue-200">You</p><p className="mt-2 text-sm font-semibold">When does academic registration close?</p><small className="mt-2 block text-right text-[10px] text-blue-200">10:24 AM ✓</small></div>
            <div className="relative mt-5 rounded-xl border border-white/10 bg-[#0c2859] p-4"><p className="text-xs font-bold text-[#c7ff62]">● &nbsp; Answer found in 2 official sources</p><div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><span className="rounded-lg bg-white/5 p-2">Academic Handbook.pdf<br/><b>Page 12</b></span><span className="rounded-lg bg-white/5 p-2">Registrar Notice.pdf<br/><b>Page 3</b></span></div><p className="mt-4 text-base font-medium">Academic registration closes on <b className="text-[#c7ff62]">Friday at 5:00 PM.</b></p><p className="mt-2 text-xs leading-5 text-blue-100">Make sure to complete your registration before the deadline to avoid penalties.</p></div>
            <div className="relative mt-4 flex gap-2"><button className="flex-1 rounded-xl border border-white/20 py-2 text-xs font-bold">Create reminder</button><button className="flex-1 rounded-xl bg-[#2854a9] py-2 text-xs font-bold">Open documents</button></div>
          </div>
          <div className="absolute -bottom-2 -right-3 flex items-center gap-2 rounded-xl bg-[#f4f2ec] px-3 py-2 text-[#112956] shadow-lg"><BellRing size={16} className="text-blue-700"/><span className="text-xs font-bold">Deadline kept in view</span></div>
        </div>
      </div>
    </section>

    <section id="discover" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">The KiliGuide way</p><h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-.04em]">Less searching.<br/>More certainty.</h2><p className="mt-5 max-w-sm leading-7 text-slate-600">Campus information should be easy to find and safe to act on. KiliGuide makes the next right action obvious.</p></div><div className="divide-y divide-[#d7d5cd] border-y border-[#d7d5cd]">{outcomes.map(([number,title,detail])=><article key={number} className="grid grid-cols-[50px_1fr_auto] gap-3 py-6 sm:grid-cols-[70px_1fr_auto] sm:gap-6"><span className="text-sm font-black text-blue-700">{number}</span><div><h3 className="text-xl font-black tracking-tight">{title}</h3><p className="mt-1 max-w-md text-sm leading-6 text-slate-600">{detail}</p></div><ArrowUpRight className="text-blue-700" size={20}/></article>)}</div></div></section>

    <section className="bg-[#e3e8f0] px-5 py-16 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-center text-xs font-bold uppercase tracking-[.18em] text-blue-700">Designed around real student needs</p><div className="mt-8 grid gap-4 md:grid-cols-3"><article className="bg-[#fffdf8] p-6 sm:p-7"><CalendarDays className="text-blue-700"/><h3 className="mt-10 text-2xl font-black tracking-tight">Your time matters.</h3><p className="mt-3 text-sm leading-6 text-slate-600">Bring in your timetable and receive timely class and deadline reminders.</p></article><article className="bg-[#c7ff62] p-6 sm:p-7"><BookOpenCheck className="text-[#112956]"/><h3 className="mt-10 text-2xl font-black tracking-tight">Answers need evidence.</h3><p className="mt-3 text-sm leading-6 text-[#28405f]">Every AI answer is grounded in retrieved university sources that you can inspect.</p></article><article className="bg-[#12356f] p-6 text-white sm:p-7"><MessageCircleMore className="text-[#c7ff62]"/><h3 className="mt-10 text-2xl font-black tracking-tight">Support should feel human.</h3><p className="mt-3 text-sm leading-6 text-blue-100">Open a ticket, follow updates, and know which department is handling it.</p></article></div></div></section>

    <footer className="bg-[#0a1e46] px-5 py-12 text-white sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#c7ff62] font-black text-[#0a1e46]">K</span><b className="text-lg">KiliGuide</b></div><p className="mt-3 text-sm text-blue-200">A smarter path through DeKUT.</p></div><div className="flex flex-col items-start gap-3 sm:items-end"><Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#c7ff62] px-5 py-3 font-bold text-[#0a1e46]">Sign in to your workspace <ArrowUpRight size={17}/></Link><p className="flex items-center gap-1.5 text-xs text-blue-200"><Check size={14} className="text-[#c7ff62]"/> KiliMind AI · Built for the DeKUT community</p></div></div></footer>
  </main>;
}
