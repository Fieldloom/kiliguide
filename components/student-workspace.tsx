"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bell, CalendarDays, FileText, Menu, MessageCircleMore,
  Send, ShieldCheck, Ticket, X, Plus, SquarePen,
  Volume2, VolumeX, Copy, Check, Trash2, Clock,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Tab = "Chat" | "Documents" | "Notices" | "My timetable" | "Support";
const navigation: [Tab, any][] = [
  ["Documents", FileText],
  ["Notices", Bell],
  ["My timetable", CalendarDays],
  ["Support", Ticket],
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

function groupByDate(convs: Conversation[]) {
  const now = Date.now();
  const r = { today: [] as Conversation[], yesterday: [] as Conversation[], week: [] as Conversation[], older: [] as Conversation[] };
  for (const c of convs) {
    const d = now - c.createdAt;
    if (d < 86400000) r.today.push(c);
    else if (d < 172800000) r.yesterday.push(c);
    else if (d < 604800000) r.week.push(c);
    else r.older.push(c);
  }
  return r;
}

// ── Markdown renderer with ChatGPT-like styling ─────────────────────────
function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="md-body">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p style={{ margin: "0 0 12px", lineHeight: 1.75 }}>{children}</p>,
        strong: ({ children }) => <strong style={{ fontWeight: 700, color: "#ececec" }}>{children}</strong>,
        em: ({ children }) => <em style={{ fontStyle: "italic", color: "#c0c0c0" }}>{children}</em>,
        h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 800, margin: "18px 0 10px", color: "#ececec", letterSpacing: "-0.02em" }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px", color: "#ececec" }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 700, margin: "14px 0 6px", color: "#ececec" }}>{children}</h3>,
        ul: ({ children }) => <ul style={{ margin: "8px 0 12px", paddingLeft: 26, listStyleType: "disc" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ margin: "8px 0 12px", paddingLeft: 26, listStyleType: "decimal" }}>{children}</ol>,
        li: ({ children }) => <li style={{ lineHeight: 1.75, color: "#dedede", marginBottom: 5, display: "list-item", paddingLeft: 4 }}>{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) return (
            <pre style={{ background: "#1a1a1a", borderRadius: 8, padding: "12px 16px", overflowX: "auto", margin: "10px 0", border: "1px solid #2a2a2a" }}>
              <code style={{ fontSize: 13, fontFamily: "monospace", color: "#a8ff78" }}>{children}</code>
            </pre>
          );
          return <code style={{ background: "#2a2a2a", borderRadius: 4, padding: "2px 6px", fontSize: 13, fontFamily: "monospace", color: "#a8ff78" }}>{children}</code>;
        },
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: "3px solid #3a3a3a", paddingLeft: 14, margin: "10px 0", color: "#8e8ea0", fontStyle: "italic" }}>{children}</blockquote>
        ),
        hr: () => <hr style={{ border: "none", borderTop: "1px solid #2a2a2a", margin: "16px 0" }} />,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#19c37d", textDecoration: "underline" }}>{children}</a>,
        table: ({ children }) => (
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table>
          </div>
        ),
        th: ({ children }) => <th style={{ border: "1px solid #2a2a2a", padding: "8px 12px", background: "#2a2a2a", fontWeight: 700, color: "#ececec", textAlign: "left" }}>{children}</th>,
        td: ({ children }) => <td style={{ border: "1px solid #2a2a2a", padding: "8px 12px", color: "#dedede" }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}

export function StudentWorkspace() {
  const [tab, setTab] = useState<Tab>("Chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
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

  // Load persisted data
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
    try {
      const saved = localStorage.getItem("kiliguide_conversations");
      if (saved) setConversations(JSON.parse(saved));
      const savedSidebar = localStorage.getItem("kiliguide_sidebar");
      if (savedSidebar !== null) setSidebarOpen(savedSidebar === "true");
    } catch {}
  }, []);

  useEffect(() => {
    if (conversations.length > 0) localStorage.setItem("kiliguide_conversations", JSON.stringify(conversations.slice(0, 50)));
  }, [conversations]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      localStorage.setItem("kiliguide_sidebar", String(!prev));
      return !prev;
    });
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking, tab]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [query]);

  const newChat = () => { setActiveConvId(null); setTab("Chat"); setMobileSidebar(false); };
  const loadConv = (id: string) => { setActiveConvId(id); setTab("Chat"); setMobileSidebar(false); };
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
      const title = value.slice(0, 42) + (value.length > 42 ? "…" : "");
      setConversations(prev => [{ id: convId!, title, messages: [], createdAt: Date.now() }, ...prev]);
      setActiveConvId(convId);
    }
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: value };
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, userMsg], title: c.title === "New chat" ? value.slice(0, 42) : c.title } : c
    ));
    const { data, error } = await supabase.functions.invoke("chat", { body: { question: value } });
    setAsking(false);
    let astMsg: Message;
    if (error) {
      let realMsg = error.message;
      try { const b = await error.context?.json(); if (b?.error) realMsg = b.error; } catch {}
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: `I could not reach KiliGuide. Error: ${realMsg}` };
    } else {
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: data.answer, sources: data.sources, confidence: data.confidence, escalate: data.escalate };
    }
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, astMsg] } : c));
  };

  const speakMessage = (id: string, text: string) => {
    if (speaking === id) { window.speechSynthesis.cancel(); setSpeaking(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(u);
    setSpeaking(id);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });
  };

  const switchTab = (next: Tab) => { setTab(next); setMobileSidebar(false); };
  const groups = groupByDate(conversations);

  // ── Sidebar section component ──
  const ConvSection = ({ label, items }: { label: string; items: Conversation[] }) => {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "#6b6b80", padding: "0 10px 6px", textTransform: "uppercase" }}>{label}</p>
        {items.map(c => (
          <div
            key={c.id}
            onClick={() => loadConv(c.id)}
            className="conv-item"
            style={{
              display: "flex", alignItems: "center", gap: 8, borderRadius: 8,
              padding: "8px 10px", cursor: "pointer", transition: "background 0.1s",
              background: activeConvId === c.id ? "#2a2a2a" : "transparent",
              marginBottom: 1
            }}
            onMouseEnter={e => { if (activeConvId !== c.id) e.currentTarget.style.background = "#222222"; }}
            onMouseLeave={e => { if (activeConvId !== c.id) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ flex: 1, fontSize: 13, color: activeConvId === c.id ? "#ececec" : "#adadad", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
            <button
              onClick={(e) => deleteConv(c.id, e)}
              className="del-btn"
              style={{ opacity: 0, color: "#6b6b80", background: "transparent", border: "none", cursor: "pointer", padding: 2, borderRadius: 4, display: "flex", alignItems: "center", transition: "opacity 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6b6b80")}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", display: "grid", placeItems: "center", background: "#2a2a2a", flexShrink: 0 }}>
            <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ececec" }}>KiliGuide</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={newChat} title="New chat" style={{ padding: 6, borderRadius: 8, color: "#8e8ea0", background: "transparent", border: "none", cursor: "pointer", display: "flex" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#ececec"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8e8ea0"; }}
          ><SquarePen size={17} /></button>
          {/* Desktop close */}
          <button onClick={toggleSidebar} title="Close sidebar" style={{ padding: 6, borderRadius: 8, color: "#8e8ea0", background: "transparent", border: "none", cursor: "pointer", display: "flex" }}
            className="hidden lg:flex"
            onMouseEnter={e => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#ececec"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8e8ea0"; }}
          ><PanelLeftClose size={17} /></button>
          {/* Mobile close */}
          <button onClick={() => setMobileSidebar(false)} style={{ padding: 6, borderRadius: 8, color: "#8e8ea0", background: "transparent", border: "none", cursor: "pointer", display: "flex" }}
            className="lg:hidden"
          ><X size={17} /></button>
        </div>
      </div>

      {/* New chat button */}
      <div style={{ padding: "0 8px 6px" }}>
        <button onClick={newChat} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 500, color: "#adadad", background: "transparent", border: "none", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#222"; e.currentTarget.style.color = "#ececec"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#adadad"; }}
        >
          <Plus size={15} style={{ color: "#6b6b80", flexShrink: 0 }} />
          New chat
        </button>
      </div>

      {/* Nav tabs */}
      <div style={{ padding: "0 8px 8px", borderBottom: "1px solid #2a2a2a" }}>
        {navigation.map(([label, Icon]) => (
          <button key={label} onClick={() => switchTab(label)}
            style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 500, background: tab === label && !activeConvId ? "#2a2a2a" : "transparent", color: tab === label && !activeConvId ? "#ececec" : "#adadad", border: "none", cursor: "pointer", marginBottom: 1 }}
            onMouseEnter={e => { if (!(tab === label && !activeConvId)) e.currentTarget.style.background = "#222"; }}
            onMouseLeave={e => { if (!(tab === label && !activeConvId)) e.currentTarget.style.background = "transparent"; }}
          >
            <Icon size={15} style={{ flexShrink: 0, color: "#6b6b80" }} />
            {label}
          </button>
        ))}
      </div>

      {/* Conversation history */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px", scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}>
        {conversations.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px", textAlign: "center" }}>
            <Clock size={22} style={{ color: "#6b6b80", marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: "#6b6b80" }}>Your chats will appear here</p>
          </div>
        ) : (
          <>
            <ConvSection label="Today" items={groups.today} />
            <ConvSection label="Yesterday" items={groups.yesterday} />
            <ConvSection label="This week" items={groups.week} />
            <ConvSection label="Older" items={groups.older} />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #2a2a2a", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#19c37d", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#000", flexShrink: 0 }}>
            {name.slice(0, 2).toUpperCase()}
          </span>
          <span style={{ fontSize: 13, color: "#adadad", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        </div>
      </div>
    </>
  );

  return (
    <main style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: "#212121", color: "#ececec" }}>
      <style>{`
        .conv-item:hover .del-btn { opacity: 1 !important; }
        @media (max-width: 1023px) { .hidden.lg\\:flex { display: none !important; } .lg\\:hidden { display: flex !important; } }
        @media (min-width: 1024px) { .lg\\:flex { display: flex !important; } .lg\\:hidden { display: none !important; } }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <aside
        style={{
          width: sidebarOpen ? 260 : 0,
          minWidth: sidebarOpen ? 260 : 0,
          overflow: "hidden",
          flexShrink: 0,
          background: "#171717",
          borderRight: sidebarOpen ? "1px solid #2a2a2a" : "none",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s ease, min-width 0.25s ease",
          position: "relative",
        }}
        className="hidden lg:flex"
      >
        <div style={{ width: 260, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <SidebarContent />
        </div>
      </aside>

      {/* ── Mobile Sidebar (overlay) ── */}
      {mobileSidebar && (
        <>
          <button onClick={() => setMobileSidebar(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)" }} className="lg:hidden" aria-label="Close" />
          <aside style={{ position: "fixed", inset: "0 auto 0 0", width: 280, zIndex: 50, background: "#171717", borderRight: "1px solid #2a2a2a", display: "flex", flexDirection: "column" }} className="lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main Content ── */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <header style={{ height: 52, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", flexShrink: 0, borderBottom: "1px solid #2a2a2a" }}>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileSidebar(true)} style={{ padding: 6, borderRadius: 8, color: "#8e8ea0", background: "transparent", border: "none", cursor: "pointer" }} className="lg:hidden">
            <Menu size={19} />
          </button>
          {/* Desktop sidebar toggle */}
          <button onClick={toggleSidebar} title={sidebarOpen ? "Close sidebar" : "Open sidebar"} style={{ padding: 6, borderRadius: 8, color: "#8e8ea0", background: "transparent", border: "none", cursor: "pointer", display: "none" }}
            className="hidden lg:flex"
            onMouseEnter={e => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#ececec"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8e8ea0"; }}
          >
            {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeft size={19} />}
          </button>

          <span style={{ fontSize: 14, fontWeight: 600, color: "#ececec" }}>
            {tab === "Chat" ? (activeConv ? activeConv.title.slice(0, 50) : "KiliGuide") : tab}
          </span>

          {tab === "Chat" && (
            <button onClick={newChat} style={{ marginLeft: "auto", padding: 6, borderRadius: 8, color: "#8e8ea0", background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#ececec"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8e8ea0"; }}
            >
              <SquarePen size={17} />
            </button>
          )}
        </header>

        {/* Content */}
        {tab === "Chat" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
            {/* Scrollable messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}>
              {messages.length === 0 ? (
                /* Welcome */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 200px)", padding: "40px 24px" }}>
                  <span style={{ width: 64, height: 64, borderRadius: 20, overflow: "hidden", display: "grid", placeItems: "center", background: "#2a2a2a", marginBottom: 20 }}>
                    <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
                  </span>
                  <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: "center", letterSpacing: "-0.02em", marginBottom: 8 }}>Hi, {name.split(" ")[0]} 👋</h1>
                  <p style={{ color: "#8e8ea0", fontSize: 15, textAlign: "center", maxWidth: 380, marginBottom: 36 }}>How can KiliGuide help you today?</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, width: "100%", maxWidth: 580 }}>
                    {[
                      ["📋 Registration & Admission", "What are the rules for new students?"],
                      ["💰 Fees & Finance", "How do I clear my fee balance?"],
                      ["🏠 Accommodation", "Are there internal hostels available?"],
                      ["📝 Exams & Results", "What happens if I miss a CAT?"]
                    ].map(([title, detail]) => (
                      <button key={title} onClick={() => ask(`${title}: ${detail}`)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", borderRadius: 12, padding: "14px 16px", textAlign: "left", background: "#2a2a2a", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                      >
                        <b style={{ fontSize: 13, fontWeight: 600, color: "#ececec", marginBottom: 4 }}>{title}</b>
                        <small style={{ fontSize: 12, color: "#8e8ea0", lineHeight: 1.5 }}>{detail}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 160px", width: "100%" }}>
                  {messages.map((m) => (
                    <div key={m.id} style={{ marginBottom: 24 }}>
                      {m.role === "user" ? (
                        /* User bubble */
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <div style={{ maxWidth: "75%", borderRadius: 20, padding: "12px 18px", fontSize: 15, lineHeight: 1.65, background: "#2a2a2a", color: "#ececec" }}>
                            {m.content}
                          </div>
                        </div>
                      ) : (
                        /* Assistant message */
                        <div style={{ display: "flex", gap: 14 }}>
                          <span style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, background: "transparent" }}>
                            <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Markdown content */}
                            <div style={{ fontSize: 15, color: "#dedede", lineHeight: 1.75 }}>
                              <MarkdownMessage content={m.content} />
                            </div>

                            {/* Sources */}
                            {m.sources && m.sources.length > 0 && (
                              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {m.sources.map((s, i) => (
                                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 500, background: "#2a2a2a", color: "#8e8ea0", cursor: "default" }}>
                                    <FileText size={11} />{s.title}{s.page ? ` · P${s.page}` : ""}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Escalate */}
                            {m.escalate && (
                              <div style={{ marginTop: 14 }}>
                                <button onClick={() => switchTab("Support")} style={{ borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, background: "#ececec", color: "#000", border: "none", cursor: "pointer" }}>
                                  Contact Human Support
                                </button>
                              </div>
                            )}

                            {/* Action row */}
                            <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                              <button onClick={() => copyMessage(m.id, m.content)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: "transparent", border: "none", cursor: "pointer", color: copied === m.id ? "#19c37d" : "#6b6b80", transition: "color 0.15s" }}
                                onMouseEnter={e => { if (copied !== m.id) e.currentTarget.style.color = "#ececec"; }}
                                onMouseLeave={e => { if (copied !== m.id) e.currentTarget.style.color = "#6b6b80"; }}
                              >
                                {copied === m.id ? <Check size={13} /> : <Copy size={13} />}
                                {copied === m.id ? "Copied" : "Copy"}
                              </button>
                              <button onClick={() => speakMessage(m.id, m.content)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: "transparent", border: "none", cursor: "pointer", color: speaking === m.id ? "#19c37d" : "#6b6b80", transition: "color 0.15s" }}
                                onMouseEnter={e => { if (speaking !== m.id) e.currentTarget.style.color = "#ececec"; }}
                                onMouseLeave={e => { if (speaking !== m.id) e.currentTarget.style.color = "#6b6b80"; }}
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

                  {/* Typing dots */}
                  {asking && (
                    <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                      <span style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
                        <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 0" }}>
                        {[0, 150, 300].map(d => (
                          <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8e8ea0", animation: "bounce 1.2s infinite", animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input bar */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 24px", background: "linear-gradient(to top, #212121 65%, transparent)" }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, borderRadius: 18, padding: "10px 12px", background: "#2a2a2a", border: "1px solid #3a3a3a", transition: "border-color 0.15s" }}
                  onFocusCapture={e => (e.currentTarget.style.borderColor = "#525252")}
                  onBlurCapture={e => (e.currentTarget.style.borderColor = "#3a3a3a")}
                >
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
                    placeholder="Ask anything about DeKUT…"
                    rows={1}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 15, color: "#ececec", minHeight: 32, maxHeight: 200, lineHeight: 1.6, padding: "2px 6px", scrollbarWidth: "none" }}
                  />
                  <button onClick={() => ask()} disabled={!query.trim() || asking}
                    style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "none", cursor: query.trim() && !asking ? "pointer" : "not-allowed", background: query.trim() && !asking ? "#ececec" : "#3a3a3a", color: query.trim() && !asking ? "#000" : "#8e8ea0", transition: "all 0.15s" }}
                  >
                    <Send size={16} style={{ marginLeft: 1 }} />
                  </button>
                </div>
                <p style={{ textAlign: "center", fontSize: 11, color: "#6b6b80", marginTop: 10 }}>KiliGuide can make mistakes. Always verify critical academic information.</p>
              </div>
            </div>
          </div>
        ) : tab === "Documents" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Official Documents</h1>
              <p style={{ color: "#8e8ea0", marginBottom: 32 }}>Browse approved university knowledge available to KiliGuide.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {documents.length ? documents.map(d => (
                  <article key={d.id} style={{ borderRadius: 12, background: "#2a2a2a", padding: "20px", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#212121", display: "grid", placeItems: "center", marginBottom: 14 }}>
                      <FileText size={17} style={{ color: "#8e8ea0" }} />
                    </div>
                    <small style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#8e8ea0", textTransform: "uppercase" }}>{d.category}</small>
                    <h2 style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: "#ececec", lineHeight: 1.45 }}>{d.title}</h2>
                  </article>
                )) : <p style={{ color: "#8e8ea0" }}>No approved documents yet.</p>}
              </div>
            </div>
          </div>
        ) : tab === "Notices" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Campus Notices</h1>
              <p style={{ color: "#8e8ea0", marginBottom: 32 }}>Official updates relevant to your university journey.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notices.length ? notices.map(n => (
                  <article key={n.id} style={{ borderRadius: 12, background: "#2a2a2a", padding: "20px 24px", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
                  >
                    <small style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#8e8ea0", textTransform: "uppercase" }}>{n.category || "CAMPUS"}</small>
                    <h2 style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: "#ececec" }}>{n.title}</h2>
                    <p style={{ marginTop: 8, fontSize: 14, color: "#adadad", lineHeight: 1.65 }}>{n.summary || "Open this notice for official details."}</p>
                  </article>
                )) : <p style={{ color: "#8e8ea0" }}>No notices published yet.</p>}
              </div>
            </div>
          </div>
        ) : tab === "My timetable" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>My Timetable</h1>
              <p style={{ color: "#8e8ea0", marginBottom: 32 }}>Upload your timetable to enable private class reminders.</p>
              <div style={{ borderRadius: 16, padding: "64px 32px", textAlign: "center", border: "2px dashed #2a2a2a" }}>
                <CalendarDays size={40} style={{ color: "#6b6b80", margin: "0 auto 16px" }} />
                <b style={{ fontSize: 16, color: "#adadad" }}>Your private schedule will appear here.</b>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <Support switchTab={switchTab} />
            </div>
          </div>
        )}
      </section>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </main>
  );
}

function Support({ switchTab }: { switchTab: (t: Tab) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const depts = ["Registrar", "Finance", "ICT support", "Accommodation", "Student Welfare", "Academic department"];

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Get Support</h1>
      <p style={{ color: "#8e8ea0", marginBottom: 32 }}>When KiliGuide cannot answer, a department can help.</p>
      {active && !submitted ? (
        <div style={{ borderRadius: 14, background: "#2a2a2a", padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Contact {active}</h2>
          <textarea rows={5} placeholder="Describe your issue in detail…"
            style={{ width: "100%", borderRadius: 10, border: "1px solid #3a3a3a", background: "#212121", color: "#ececec", padding: "12px 14px", fontSize: 14, outline: "none", resize: "vertical" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#525252")}
            onBlur={e => (e.currentTarget.style.borderColor = "#3a3a3a")}
          />
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button onClick={() => setSubmitted(true)} style={{ borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, background: "#ececec", color: "#000", border: "none", cursor: "pointer" }}>Submit Ticket</button>
            <button onClick={() => setActive(null)} style={{ borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 600, background: "transparent", color: "#8e8ea0", border: "none", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : submitted ? (
        <div style={{ borderRadius: 14, background: "#2a2a2a", padding: 28 }}>
          <b style={{ fontSize: 17, display: "block", marginBottom: 8 }}>✅ Ticket Submitted</b>
          <p style={{ color: "#8e8ea0", fontSize: 14 }}>The {active} department will reply via your student email.</p>
          <button onClick={() => { setSubmitted(false); setActive(null); }} style={{ marginTop: 18, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, background: "#212121", color: "#ececec", border: "1px solid #3a3a3a", cursor: "pointer" }}>Go back</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {depts.map(x => (
            <button key={x} onClick={() => setActive(x)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 12, padding: "18px 20px", textAlign: "left", background: "#2a2a2a", border: "none", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#303030")}
              onMouseLeave={e => (e.currentTarget.style.background = "#2a2a2a")}
            >
              <span>
                <b style={{ display: "block", fontSize: 14, color: "#ececec" }}>{x}</b>
                <small style={{ fontSize: 12, color: "#8e8ea0" }}>Open a support request</small>
              </span>
              <MessageCircleMore size={17} style={{ color: "#6b6b80", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}


