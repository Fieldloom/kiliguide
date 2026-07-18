"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Bell, BookOpen, Bot, CalendarDays, FileText, Menu,
  MessageCircleMore, Search, Send, ShieldCheck, Ticket, X,
  Plus, SquarePen, Volume2, VolumeX, Copy, Check,
  ChevronDown, Trash2, Clock
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Tab = "Chat" | "Documents" | "Notices" | "My timetable" | "Support";
const navigation: [Tab, any][] = [
  ["Chat", MessageCircleMore],
  ["Documents", FileText],
  ["Notices", Bell],
  ["My timetable", CalendarDays],
  ["Support", Ticket]
];

type Source = { title: string; page?: number | null };
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: number;
  escalate?: boolean;
};
type Conversation = { id: string; title: string; messages: Message[]; createdAt: number };

function groupByDate(conversations: Conversation[]) {
  const now = Date.now();
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const week: Conversation[] = [];
  const older: Conversation[] = [];
  for (const c of conversations) {
    const diff = now - c.createdAt;
    if (diff < 86400000) today.push(c);
    else if (diff < 172800000) yesterday.push(c);
    else if (diff < 604800000) week.push(c);
    else older.push(c);
  }
  return { today, yesterday, week, older };
}

export function StudentWorkspace() {
  const [tab, setTab] = useState<Tab>("Chat");
  const [drawer, setDrawer] = useState(false);
  const [name, setName] = useState("Student");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const messages = activeConv?.messages ?? [];

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("documents").select("id,title,category,file_type,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(6),
      supabase.from("notices").select("id,title,category,published_at,summary").order("published_at", { ascending: false }).limit(4)
    ]).then(([auth, docs, news]) => {
      setName(auth.data.user?.user_metadata?.full_name || auth.data.user?.email?.split("@")[0] || "Student");
      setDocuments(docs.data ?? []);
      setNotices(news.data ?? []);
    });

    // Load saved conversations from localStorage
    try {
      const saved = localStorage.getItem("kiliguide_conversations");
      if (saved) {
        const parsed: Conversation[] = JSON.parse(saved);
        setConversations(parsed);
      }
    } catch {}
  }, []);

  // Persist conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("kiliguide_conversations", JSON.stringify(conversations.slice(0, 50)));
    }
  }, [conversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, asking, tab]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [query]);

  const startNewConv = () => {
    const id = Date.now().toString();
    const conv: Conversation = { id, title: "New chat", messages: [], createdAt: Date.now() };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
    return id;
  };

  const newChat = () => {
    setActiveConvId(null);
    setTab("Chat");
    setDrawer(false);
  };

  const loadConv = (id: string) => {
    setActiveConvId(id);
    setTab("Chat");
    setDrawer(false);
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  };

  const ask = async (value = query) => {
    if (!supabase || !value.trim() || asking) return;
    setTab("Chat");
    setQuery("");
    setAsking(true);

    let convId = activeConvId;
    if (!convId) {
      convId = Date.now().toString();
      const title = value.slice(0, 40) + (value.length > 40 ? "…" : "");
      const conv: Conversation = { id: convId, title, messages: [], createdAt: Date.now() };
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(convId);
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: value };
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, userMsg], title: c.title === "New chat" ? value.slice(0, 40) + (value.length > 40 ? "…" : "") : c.title }
        : c
    ));

    const { data, error } = await supabase.functions.invoke("chat", { body: { question: value } });
    setAsking(false);

    let astMsg: Message;
    if (error) {
      let realMsg = error.message;
      try { const errBody = await error.context?.json(); if (errBody?.error) realMsg = errBody.error; } catch {}
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: `I could not reach KiliGuide. Error: ${realMsg}` };
    } else {
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: data.answer, sources: data.sources, confidence: data.confidence, escalate: data.escalate };
    }

    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, astMsg] } : c
    ));
  };

  const speakMessage = (id: string, text: string) => {
    if (speaking === id) {
      window.speechSynthesis.cancel();
      setSpeaking(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(null);
    utter.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utter);
    setSpeaking(id);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const switchTab = (next: Tab) => { setTab(next); setDrawer(false); };
  const groups = groupByDate(conversations);

  const SidebarSection = ({ label, items }: { label: string; items: Conversation[] }) => {
    if (!items.length) return null;
    return (
      <div className="mb-2">
        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8e8ea0]">{label}</p>
        {items.map(c => (
          <div
            key={c.id}
            onClick={() => loadConv(c.id)}
            className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${activeConvId === c.id ? "bg-[#2a2a2a] text-white" : "text-[#ececec] hover:bg-[#2a2a2a]"}`}
          >
            <MessageCircleMore size={14} className="shrink-0 text-[#8e8ea0]" />
            <span className="flex-1 truncate text-[13px]">{c.title}</span>
            <button
              onClick={(e) => deleteConv(c.id, e)}
              className="hidden group-hover:flex text-[#8e8ea0] hover:text-red-400 transition-colors p-0.5 rounded"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="flex h-screen w-full overflow-hidden" style={{ background: "#212121", color: "#ececec", fontFamily: "'Inter', 'Söhne', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${drawer ? "translate-x-0" : "-translate-x-full"}`} style={{ background: "#171717", borderRight: "1px solid #2a2a2a" }}>

        {/* Sidebar Header */}
        <div className="flex h-[60px] shrink-0 items-center justify-between px-3">
          <button
            onClick={newChat}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#2a2a2a]"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shrink-0" style={{ background: "#19c37d" }}>
              {name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[13px] font-semibold truncate max-w-[120px] text-[#ececec]">{name}</span>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={newChat} title="New chat" className="rounded-lg p-1.5 text-[#8e8ea0] hover:bg-[#2a2a2a] hover:text-white transition-colors">
              <SquarePen size={17} />
            </button>
            <button onClick={() => setDrawer(false)} className="rounded-lg p-1.5 text-[#8e8ea0] hover:bg-[#2a2a2a] lg:hidden">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* New Chat button */}
        <div className="px-3 pb-2">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#2a2a2a] text-[#ececec]"
          >
            <Plus size={16} className="text-[#8e8ea0]" />
            New chat
          </button>
        </div>

        {/* Navigation */}
        <div className="px-3 pb-3" style={{ borderBottom: "1px solid #2a2a2a" }}>
          {navigation.slice(1).map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => switchTab(label)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === label && activeConvId === null ? "bg-[#2a2a2a] text-white" : "text-[#ececec] hover:bg-[#2a2a2a]"}`}
            >
              <Icon size={16} className="text-[#8e8ea0] shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin" style={{ scrollbarColor: "#2a2a2a transparent" }}>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock size={24} className="text-[#8e8ea0] mb-2" />
              <p className="text-[12px] text-[#8e8ea0]">Your conversations will appear here</p>
            </div>
          ) : (
            <>
              <SidebarSection label="Today" items={groups.today} />
              <SidebarSection label="Yesterday" items={groups.yesterday} />
              <SidebarSection label="This week" items={groups.week} />
              <SidebarSection label="Older" items={groups.older} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: "1px solid #2a2a2a" }}>
          <p className="flex items-center gap-2 text-[11px] font-medium text-[#8e8ea0] justify-center">
            <ShieldCheck size={12} /> Verified DeKUT sources only
          </p>
        </div>
      </aside>

      {/* Overlay */}
      {drawer && (
        <button
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Main Content */}
      <section className="flex flex-1 flex-col h-full min-w-0 overflow-hidden" style={{ background: "#212121" }}>

        {/* Mobile Header */}
        <header className="flex h-[60px] shrink-0 items-center gap-3 px-4 lg:hidden" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-[#8e8ea0] hover:bg-[#2a2a2a] hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <div className="font-semibold text-[#ececec] text-sm">{tab}</div>
          <button onClick={newChat} className="ml-auto rounded-lg p-2 text-[#8e8ea0] hover:bg-[#2a2a2a] hover:text-white transition-colors">
            <SquarePen size={18} />
          </button>
        </header>

        {/* Content Area */}
        {tab === "Chat" ? (
          <div className="flex flex-1 flex-col min-h-0 relative">
            {/* Messages scroll area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}
            >
              {messages.length === 0 ? (
                /* Welcome screen */
                <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl mb-6 overflow-hidden" style={{ background: "#2a2a2a" }}>
                    <img src="/logo.png" alt="KiliGuide" className="w-full h-full object-cover scale-[1.3] pt-2" />
                  </span>
                  <h1 className="text-3xl font-semibold tracking-tight text-center" style={{ color: "#ececec" }}>
                    Hi, {name.split(" ")[0]} 👋
                  </h1>
                  <p className="mt-2 text-[15px] text-center max-w-sm" style={{ color: "#8e8ea0" }}>
                    How can KiliGuide help you today?
                  </p>
                  <div className="mt-10 w-full max-w-2xl grid gap-3 sm:grid-cols-2">
                    {[
                      ["📋 Registration & Admission", "What are the rules for new students?"],
                      ["💰 Fees & Finance", "How do I clear my fee balance?"],
                      ["🏠 Accommodation", "Are there internal hostels available?"],
                      ["📝 Exams & Results", "What happens if I miss a CAT?"]
                    ].map(([title, detail]) => (
                      <button
                        key={title}
                        onClick={() => ask(`Tell me about ${title}: ${detail}`)}
                        className="flex flex-col items-start rounded-xl p-4 text-left transition-colors"
                        style={{ background: "#2a2a2a" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                      >
                        <b className="text-[14px] font-semibold" style={{ color: "#ececec" }}>{title}</b>
                        <small className="mt-1 text-[12px]" style={{ color: "#8e8ea0" }}>{detail}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message list */
                <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-40 space-y-6">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "user" ? (
                        <div className="max-w-[75%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed" style={{ background: "#2a2a2a", color: "#ececec" }}>
                          {m.content}
                        </div>
                      ) : (
                        <div className="flex gap-3 w-full">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full overflow-hidden mt-1" style={{ background: "transparent" }}>
                            <img src="/logo.png" alt="KiliGuide" className="w-full h-full object-cover scale-[1.3] pt-1" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: "#ececec" }}>
                              {m.content}
                            </div>

                            {/* Sources */}
                            {m.sources && m.sources.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {m.sources.map((s, i) => (
                                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium cursor-pointer transition-colors" style={{ background: "#2a2a2a", color: "#8e8ea0" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                                  >
                                    <FileText size={11} />
                                    {s.title}{s.page ? ` · P${s.page}` : ""}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Escalate button */}
                            {m.escalate && (
                              <div className="mt-4">
                                <button onClick={() => switchTab("Support")} className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors" style={{ background: "#ececec", color: "#000" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#d0d0d0")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "#ececec")}
                                >
                                  Contact Human Support
                                </button>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="mt-3 flex items-center gap-1">
                              <button
                                onClick={() => copyMessage(m.id, m.content)}
                                title="Copy"
                                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                                style={{ color: "#8e8ea0" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#ececec")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#8e8ea0")}
                              >
                                {copied === m.id ? <Check size={13} /> : <Copy size={13} />}
                                {copied === m.id ? "Copied" : "Copy"}
                              </button>
                              <button
                                onClick={() => speakMessage(m.id, m.content)}
                                title={speaking === m.id ? "Stop reading" : "Read aloud"}
                                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                                style={{ color: speaking === m.id ? "#19c37d" : "#8e8ea0" }}
                                onMouseEnter={e => { if (speaking !== m.id) (e.currentTarget.style.color = "#ececec"); }}
                                onMouseLeave={e => { if (speaking !== m.id) (e.currentTarget.style.color = "#8e8ea0"); }}
                              >
                                {speaking === m.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                                {speaking === m.id ? "Stop" : "Read aloud"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {asking && (
                    <div className="flex gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full overflow-hidden mt-1">
                        <img src="/logo.png" alt="KiliGuide" className="w-full h-full object-cover scale-[1.3] pt-1" />
                      </span>
                      <div className="flex items-center gap-1.5 py-4">
                        {[0, 150, 300].map(delay => (
                          <div key={delay} className="h-2 w-2 rounded-full animate-bounce" style={{ background: "#8e8ea0", animationDelay: `${delay}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-10" style={{ background: "linear-gradient(to top, #212121 70%, transparent)" }}>
              <div className="mx-auto max-w-3xl">
                <div
                  className="flex items-end gap-2 rounded-2xl p-3 transition-all"
                  style={{ background: "#2a2a2a", border: "1px solid #3a3a3a" }}
                >
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
                    className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] outline-none leading-relaxed"
                    style={{ color: "#ececec", minHeight: "36px", maxHeight: "200px", scrollbarWidth: "none" }}
                    placeholder="Ask anything about DeKUT..."
                    rows={1}
                  />
                  <button
                    onClick={() => ask()}
                    disabled={!query.trim() || asking}
                    className="mb-0.5 rounded-lg p-2 transition-all flex shrink-0 items-center justify-center h-9 w-9"
                    style={{
                      background: query.trim() && !asking ? "#ececec" : "#3a3a3a",
                      color: query.trim() && !asking ? "#000" : "#8e8ea0"
                    }}
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </div>
                <p className="mt-2.5 text-center text-[11px]" style={{ color: "#8e8ea0" }}>
                  KiliGuide can make mistakes. Always verify critical academic information.
                </p>
              </div>
            </div>
          </div>
        ) : tab === "Documents" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#ececec" }}>Official Documents</h1>
              <p className="mt-2 text-[15px]" style={{ color: "#8e8ea0" }}>Browse approved university knowledge available to KiliGuide.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.length ? documents.map((d: any) => (
                  <article key={d.id} className="rounded-xl p-5 cursor-pointer transition-colors" style={{ background: "#2a2a2a" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-4" style={{ background: "#212121" }}>
                      <FileText size={18} style={{ color: "#8e8ea0" }} />
                    </div>
                    <small className="font-semibold text-[11px] uppercase tracking-wider" style={{ color: "#8e8ea0" }}>{d.category}</small>
                    <h2 className="mt-1 text-[14px] font-semibold leading-snug" style={{ color: "#ececec" }}>{d.title}</h2>
                  </article>
                )) : <p style={{ color: "#8e8ea0" }}>No approved documents are ready yet.</p>}
              </div>
            </div>
          </div>
        ) : tab === "Notices" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#ececec" }}>Campus Notices</h1>
              <p className="mt-2 text-[15px]" style={{ color: "#8e8ea0" }}>Official updates relevant to your university journey.</p>
              <div className="mt-8 space-y-4">
                {notices.length ? notices.map((n: any) => (
                  <article key={n.id} className="rounded-xl p-6 transition-colors" style={{ background: "#2a2a2a" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                  >
                    <small className="font-semibold text-[11px] uppercase tracking-wider" style={{ color: "#8e8ea0" }}>{n.category || "CAMPUS"}</small>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "#ececec" }}>{n.title}</h2>
                    <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "#adadad" }}>{n.summary || "Open this notice for official details and important dates."}</p>
                  </article>
                )) : <p style={{ color: "#8e8ea0" }}>No notices have been published yet.</p>}
              </div>
            </div>
          </div>
        ) : tab === "My timetable" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#ececec" }}>My Timetable</h1>
              <p className="mt-2 text-[15px]" style={{ color: "#8e8ea0" }}>Upload your timetable to enable private class reminders.</p>
              <div className="mt-8 rounded-2xl p-16 text-center" style={{ border: "2px dashed #2a2a2a", background: "#212121" }}>
                <CalendarDays size={40} style={{ color: "#8e8ea0", margin: "0 auto" }} />
                <b className="mt-5 block text-lg font-semibold tracking-tight" style={{ color: "#adadad" }}>Your private schedule will appear here.</b>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
              <Support switchTab={switchTab} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Support({ switchTab }: { switchTab: (t: Tab) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#ececec" }}>Get Support</h1>
      <p className="mt-2 text-[15px]" style={{ color: "#8e8ea0" }}>When KiliGuide cannot answer from official sources, a department can help.</p>

      {active && !submitted ? (
        <div className="mt-8 rounded-xl p-8" style={{ background: "#2a2a2a" }}>
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: "#ececec" }}>Contact {active}</h2>
          <textarea className="mt-6 w-full rounded-xl p-4 text-[14px] outline-none resize-none" rows={5}
            placeholder="Describe your issue in detail..."
            style={{ background: "#212121", color: "#ececec", border: "1px solid #3a3a3a" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#525252")}
            onBlur={e => (e.currentTarget.style.borderColor = "#3a3a3a")}
          />
          <div className="mt-6 flex gap-3">
            <button onClick={() => setSubmitted(true)} className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors" style={{ background: "#ececec", color: "#000" }}>Submit Ticket</button>
            <button onClick={() => setActive(null)} className="rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors" style={{ color: "#8e8ea0" }}>Cancel</button>
          </div>
        </div>
      ) : submitted ? (
        <div className="mt-8 rounded-xl p-8" style={{ background: "#2a2a2a" }}>
          <b className="block text-lg font-semibold tracking-tight" style={{ color: "#ececec" }}>✅ Ticket Submitted Successfully</b>
          <p className="mt-2 text-[14px]" style={{ color: "#8e8ea0" }}>The {active} department will get back to you via your student email.</p>
          <button onClick={() => { setSubmitted(false); setActive(null); }} className="mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors" style={{ background: "#212121", color: "#ececec", border: "1px solid #3a3a3a" }}>Go back</button>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {["Registrar", "Finance", "ICT support", "Accommodation", "Student Welfare", "Academic department"].map(x => (
            <button key={x} onClick={() => setActive(x)} className="flex items-center justify-between rounded-xl p-5 text-left transition-colors" style={{ background: "#2a2a2a" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
              onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
            >
              <span>
                <b className="block font-semibold text-[14px]" style={{ color: "#ececec" }}>{x}</b>
                <small className="mt-1 block text-[12px]" style={{ color: "#8e8ea0" }}>Open a support request</small>
              </span>
              <MessageCircleMore size={18} style={{ color: "#8e8ea0" }} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
