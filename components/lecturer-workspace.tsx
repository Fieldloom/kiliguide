"use client";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Bell, BookOpen, BookOpenCheck, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock, Clock as ClockIcon, Download, File as FileIcon, FileText, GraduationCap, HeadphonesIcon, Home, Image as ImageIcon, Landmark, Loader2, Lock, LogOut, Menu, MessageCircleMore, MessageSquare, PanelLeft, PanelLeftClose, Plus, Search, Send, Settings, ShieldCheck, Sparkles, Ticket, Trash2, UploadCloud, User, Volume2, VolumeX, Wallet, X, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";

type Tab = "Home" | "Chats" | "Documents" | "Notices" | "Class Schedules" | "Support" | "Profile" | "Settings";
const navigation: [Tab, any][] = [
  ["Home", Home],
  ["Chats", MessageCircleMore],
  ["Documents", FileText],
  ["Notices", Bell],
  ["Class Schedules", CalendarDays],
  ["Support", Ticket],
];

type Source = { title: string; page?: number | null };
type Message = { id: string; role: "user" | "assistant"; content: string; sources?: Source[]; confidence?: number; escalate?: boolean; };
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

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 12px", lineHeight: 1.75 }}>{children}</p>,
          strong: ({ children }) => <strong style={{ fontWeight: 700, color: "#ffffff" }}>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: "italic", color: "#c0c0c0" }}>{children}</em>,
          h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 800, margin: "18px 0 10px", color: "#ffffff", letterSpacing: "-0.02em" }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 700, margin: "16px 0 8px", color: "#ffffff" }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 700, margin: "14px 0 6px", color: "#ffffff" }}>{children}</h3>,
          ul: ({ children }) => <ul style={{ margin: "8px 0 12px", paddingLeft: 26, listStyleType: "disc" }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: "8px 0 12px", paddingLeft: 26, listStyleType: "decimal" }}>{children}</ol>,
          li: ({ children }) => <li style={{ lineHeight: 1.75, color: "#ececec", marginBottom: 5, display: "list-item", paddingLeft: 4 }}>{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) return <pre style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "12px 16px", overflowX: "auto", margin: "10px 0", border: "1px solid rgba(255,255,255,0.05)" }}><code style={{ fontSize: 13, fontFamily: "monospace", color: "#a8ff78" }}>{children}</code></pre>;
            return <code style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "2px 6px", fontSize: 13, fontFamily: "monospace", color: "#a8ff78" }}>{children}</code>;
          },
          blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid rgba(255,255,255,0.2)", paddingLeft: 14, margin: "10px 0", color: "#a1a1aa", fontStyle: "italic" }}>{children}</blockquote>,
          hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "16px 0" }} />,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6", textDecoration: "underline" }}>{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function LecturerWorkspace() {
  const [tab, setTab] = useState<Tab>("Home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [name, setName] = useState("Lecturer");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [language, setLanguage] = useState("en");
  const [docQuery, setDocQuery] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketDeptId, setTicketDeptId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [readingMsgId, setReadingMsgId] = useState<string | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const messages = activeConv?.messages ?? [];

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("documents").select("id,title,category,file_type,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(20),
      supabase.from("notices").select("*").order("published_at", { ascending: false }).limit(20),
      supabase.from("tickets").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("personal_resources").select("*").eq("resource_type", "timetable").order("created_at", { ascending: false })
    , supabase.from("departments").select("id,name").order("name")]).then(async ([auth, docs, nots, tcks, times, depts]) => {
      const user = auth.data.user;
      setProfile(user);
      setName(user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Lecturer");
      if (user && supabase) {
        const { data: prof } = await supabase.from("profiles").select("preferred_language").eq("id", user.id).single();
        if (prof?.preferred_language) setLanguage(prof.preferred_language);
      }
      setDocuments(docs.data ?? []);
      setNotices(nots.data ?? []);
      setTickets(tcks.data ?? []);
      setDepartments(depts.data ?? []);
      setTimetables(times.data ?? []);
    });
    try {
      const saved = localStorage.getItem("kiliguide_conversations");
      if (saved) setConversations(JSON.parse(saved));
    } catch { }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) localStorage.setItem("kiliguide_conversations", JSON.stringify(conversations.slice(0, 50)));
  }, [conversations]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, asking, tab]);

  const loadConv = (id: string) => { setActiveConvId(id); setTab("Chats"); setMobileSidebar(false); };
  const deleteConv = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setConversations(prev => prev.filter(c => c.id !== id)); if (activeConvId === id) { setActiveConvId(null); setTab("Home"); } };
  const switchTab = (next: Tab) => { setTab(next); setMobileSidebar(false); };

  const handleCreateTicket = async () => {
    if (!supabase || !ticketSubject.trim() || !ticketDesc.trim()) return;
    setCreatingTicket(true);
    const { data, error } = await supabase.from("tickets").insert({
      subject: ticketSubject,
      description: ticketDesc,
      created_by: profile?.id,
      department_id: ticketDeptId || null
    }).select();
    if (!error && data) {
      setTickets([data[0], ...tickets]);
      setTicketSubject("");
      setTicketDesc("");
      setTicketDeptId("");
    }
    setCreatingTicket(false);
  };

  const handleUploadTimetable = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!supabase || !file || !profile) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("personal-resources").upload(path, file);
    if (!error && data) {
      const { data: dbData } = await supabase.from("personal_resources").insert({
        user_id: profile.id,
        title: file.name,
        resource_type: "timetable",
        storage_path: path
      }).select();
      if (dbData) setTimetables([dbData[0], ...timetables]);
    }
    setUploading(false);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  
  const handleUpdateLanguage = async (lang: string) => {
    setLanguage(lang);
    if (!supabase || !profile) return;
    await supabase.from("profiles").update({ preferred_language: lang }).eq("id", profile.id);
  };

  const toggleReadAloud = (msgId: string, text: string) => {
    if (!("speechSynthesis" in window)) return;
    if (readingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setReadingMsgId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "sw" ? "sw-KE" : "en-US";
      utterance.onend = () => setReadingMsgId(null);
      utterance.onerror = () => setReadingMsgId(null);
      window.speechSynthesis.speak(utterance);
      setReadingMsgId(msgId);
    }
  };

  const escalateToHuman = (msgContent: string) => {
    setTicketSubject(`Question about: ${activeConv?.title || 'KiliGuide Answer'}`);
    setTicketDesc(`I need further human clarification regarding this response:\n\n"${msgContent.substring(0, 100)}..."`);
    switchTab("Support");
  };

  const ask = async (value = query) => {
    if (!supabase || !value.trim() || asking) return;
    setTab("Chats");
    setQuery("");
    setAsking(true);
    let convId = activeConvId;
    if (!convId || tab === "Home") {
      convId = Date.now().toString();
      const title = value.slice(0, 42) + (value.length > 42 ? "…" : "");
      setConversations(prev => [{ id: convId!, title, messages: [], createdAt: Date.now() }, ...prev]);
      setActiveConvId(convId);
    }
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: value };
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg], title: c.title === "New chat" ? value.slice(0, 42) : c.title } : c));
    
    // Prefix Swahili if selected so KiliGuide answers appropriately
    const finalQuery = language === "sw" ? "(Please answer in Swahili) " + value : value;
    const { data, error } = await supabase.functions.invoke("chat", { body: { question: finalQuery, conversationId: convId } });
    setAsking(false);
    
    let astMsg: Message;
    if (error) {
      let realMsg = error.message;
      try { const b = await error.context?.json(); if (b?.error) realMsg = b.error; } catch { }
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: `I could not reach KiliGuide. Error: ${realMsg}` };
    } else {
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: data.answer, sources: data.sources };
    }
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, astMsg] } : c));
  };

  const groups = groupByDate(conversations);

  const formatRelTime = (ms: number) => {
    const min = Math.floor((Date.now() - ms) / 60000);
    if (min < 60) return `${min || 1}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const SidebarContent = () => (
    <>
      <div style={{ padding: "24px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, overflow: "hidden", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
          </span>
          <div>
            <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#fff" }}>KiliGuide</span>
            <span style={{ display: "block", fontSize: 10, color: "#a1a1aa", marginTop: 2 }}>Smarter Campus. Better Tomorrow.</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {navigation.map(([label, Icon]) => {
          const isActive = tab === label && !(label === "Chats" && !activeConvId && tab !== "Chats");
          return (
            <motion.button whileHover={{ scale: isActive ? 1 : 1.02 }} whileTap={{ scale: 0.98 }} key={label} onClick={() => switchTab(label)}
              style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontWeight: 500, background: isActive ? "rgba(139, 92, 246, 0.15)" : "transparent", color: isActive ? "#8b5cf6" : "#a1a1aa", border: isActive ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid transparent", cursor: "pointer", marginBottom: 4 }}
            >
              <Icon size={18} />
              {label}
            </motion.button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
        {conversations.length > 0 && groups.today.map(c => (
          <div key={c.id} onClick={() => loadConv(c.id)} className="conv-item" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "8px 12px", cursor: "pointer", background: activeConvId === c.id && tab === "Chats" ? "rgba(255,255,255,0.1)" : "transparent" }}>
            <span style={{ flex: 1, fontSize: 13, color: activeConvId === c.id && tab === "Chats" ? "#fff" : "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
            <button onClick={(e) => deleteConv(c.id, e)} className="del-btn" style={{ opacity: 0, color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer" }}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <main className="ambient-bg" style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", color: "#ececec", fontFamily: "'Inter', sans-serif", backgroundColor: "#06080a" }}>
      <style>{`
        .conv-item:hover .del-btn { opacity: 1 !important; }
        .conv-item:hover { background: rgba(255,255,255,0.05) !important; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media (max-width: 1023px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 1024px) {
          .mobile-only { display: none !important; }
        }

        .mobile-gradient-bg {
          background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
        }
      `}</style>

      <aside className="desktop-only glass-panel" style={{ width: sidebarOpen ? 280 : 0, transition: "width 0.4s", flexShrink: 0, flexDirection: "column", overflow: "hidden", borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none" }}>
        <div style={{ width: 280, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column" }}>
          <SidebarContent />
        </div>
      </aside>

      {mobileSidebar && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebar(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="glass-panel" style={{ position: "fixed", inset: "0 auto 0 0", width: 280, zIndex: 50, display: "flex", flexDirection: "column", height: "100%", borderRadius: 0 }}>
            <SidebarContent />
          </motion.aside>
        </AnimatePresence>
      )}

      <section style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", position: "relative", zIndex: 10 }}>
        
        <header className="desktop-only" style={{ height: 70, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 24px", gap: 16, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginRight: "auto", padding: 8, borderRadius: 8, color: "#a1a1aa", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          <motion.button onClick={()=>ask()} className="glass-button" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
            <Sparkles size={14} style={{ color: "#8b5cf6" }} /> Ask KiliGuide
          </motion.button>
          <motion.button onClick={()=>switchTab("Notices")} className="glass-button" style={{ padding: 10 }}><Bell size={18} /></motion.button>
          <motion.button onClick={()=>switchTab("Settings")} className="glass-button" style={{ padding: 10 }}><Settings size={18} /></motion.button>
        </header>

        <header className="mobile-only" style={{ height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, zIndex: 20 }}>
          <button onClick={() => setMobileSidebar(true)} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#ececec" }}>
            <Menu size={22} />
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 40, height: 40, borderRadius: 50, background: "#0B0F14", display: "grid", placeItems: "center" }}>
              <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#8b5cf6", letterSpacing: "-0.02em", lineHeight: 1 }}>KiliGuide</span>
              <span style={{ fontSize: 10, color: "#a1a1aa", marginTop: 2 }}>Official DeKUT Information</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={()=>switchTab("Notices")} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#ececec", position: "relative" }}>
              <Bell size={20} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, background: "#8b5cf6", borderRadius: "50%", border: "2px solid #06080a" }} />
            </button>
            <button onClick={()=>switchTab("Settings")} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#ececec" }}>
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        {tab === "Home" ? (
          <div style={{ flex: 1, overflowY: "auto", position: "relative" }} className="hide-scroll">
            
            {/* --- DESKTOP HOME (DASHBOARD) --- */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="desktop-only" style={{ padding: "40px 32px 100px", maxWidth: 1200, margin: "0 auto" }}>
              
              {/* Hero Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, marginBottom: 32 }}>
                
                {/* Search Hero */}
                <div className="glass-panel" style={{ padding: 40, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -50, right: -50, width: 250, height: 250, background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)" }} />
                  <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 12 }}>
                    Welcome back, <br/>
                    <span style={{ color: "#8b5cf6" }}>{name.split(" ")[0]}</span> 👋
                  </h1>
                  <p style={{ color: "#a1a1aa", fontSize: 16, marginBottom: 32 }}>Find official DeKUT regulations, policies, and notices instantly.</p>
                  
                  <div style={{ width: "100%", maxWidth: 600 }}>
                    <div className="glass-input" style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 30, padding: "8px 8px 8px 24px", border: "1px solid rgba(139, 92, 246, 0.4)", background: "rgba(0,0,0,0.5)", boxShadow: "0 8px 32px rgba(139,92,246,0.1)" }}>
                      <Search size={22} style={{ color: "#8b5cf6" }} />
                      <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Ask KiliGuide anything..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, color: "#fff" }} />
                      <motion.button onClick={() => ask()} disabled={!query.trim()} style={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", border: "none", background: query.trim() ? "#8b5cf6" : "rgba(255,255,255,0.1)", color: "#fff", cursor: query.trim() ? "pointer" : "not-allowed", position: "relative", zIndex: 10 }}>
                        <Send size={18} style={{ transform: "rotate(45deg)", marginLeft: -2 }} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Latest Notice */}
                <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245, 158, 11, 0.1)", display: "grid", placeItems: "center" }}>
                      <AlertCircle size={18} color="#f59e0b" />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Latest Notice</h3>
                  </div>
                  {notices.length > 0 ? (
                    <>
                      <h4 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{notices[0].title}</h4>
                      <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>{notices[0].summary || notices[0].body}</p>
                      <button onClick={() => switchTab("Notices")} style={{ alignSelf: "flex-start", marginTop: 16, background: "transparent", border: "none", color: "#8b5cf6", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        Read More <ChevronRight size={14} />
                      </button>
                    </>
                  ) : (
                    <p style={{ color: "#a1a1aa", fontSize: 14, marginTop: 20 }}>No active notices.</p>
                  )}
                </div>
              </div>

              {/* Quick Access Grid */}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Quick Access</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 32 }}>
                {[
                  { l: "Academics", i: GraduationCap, t: "Registration & Units", d: "What are the rules for new Lecturers?" },
                  { l: "Fees", i: Wallet, t: "Clearance & Deadlines", d: "How do I clear my fee balance?" },
                  { l: "Accommodation", i: Home, t: "Hostel Availability", d: "Are there internal hostels available?" },
                  { l: "Admissions", i: FileText, t: "Deferment Process", d: "How do I defer my studies?" },
                  { l: "Exams", i: BookOpenCheck, t: "CATs & Missing Marks", d: "What do I do about missing marks?" },
                  { l: "Support", i: HeadphonesIcon, t: "IT & Helpdesk", d: "How do I connect to Lecturer WiFi?" }
                ].map((btn, i) => (
                  <motion.div whileHover={{ y: -4, boxShadow: "0 10px 40px rgba(139,92,246,0.1)" }} key={i} onClick={() => ask(btn.d)} className="glass-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139, 92, 246, 0.1)", display: "grid", placeItems: "center" }}>
                      <btn.i size={20} style={{ color: "#8b5cf6" }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{btn.l}</span>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Split */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Recent Chats */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Recent Conversations</h3>
                    <button onClick={() => switchTab("Chats")} style={{ background: "transparent", border: "none", color: "#8b5cf6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View All</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {conversations.slice(0, 3).map(c => (
                      <div key={c.id} onClick={() => loadConv(c.id)} className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer" }}>
                        <MessageSquare size={18} style={{ color: "#8b5cf6" }} />
                        <span style={{ flex: 1, fontSize: 14, color: "#ececec", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                        <span style={{ fontSize: 12, color: "#52525b" }}>{formatRelTime(c.createdAt)}</span>
                        <ChevronRight size={18} style={{ color: "#52525b" }} />
                      </div>
                    ))}
                    {conversations.length === 0 && <p style={{ color: "#a1a1aa", fontSize: 14 }}>No recent conversations.</p>}
                  </div>
                </div>

                {/* Timetable Status & Trust */}
                <div>
                   <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Status</h3>
                   <div className="glass-panel" style={{ padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
                      <CalendarDays size={24} color="#8b5cf6" />
                      <div style={{ flex: 1 }}>
                        <b style={{ display: "block", color: "#fff", fontSize: 14 }}>Class Schedule Integration</b>
                        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{timetables.length > 0 ? "Active and monitored." : "No timetable uploaded yet."}</span>
                      </div>
                      <button onClick={() => switchTab("Class Schedules")} style={{ padding: "6px 12px", borderRadius: 12, background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{timetables.length > 0 ? "View" : "Upload"}</button>
                   </div>
                   <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(139, 92, 246, 0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={16} style={{ color: "#8b5cf6" }} /><span style={{ fontSize: 12, color: "#d4d4d8", fontWeight: 500 }}>Official Sources</span></div>
                    <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={16} style={{ color: "#8b5cf6" }} /><span style={{ fontSize: 12, color: "#d4d4d8", fontWeight: 500 }}>Verified</span></div>
                    <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap size={16} style={{ color: "#8b5cf6" }} /><span style={{ fontSize: 12, color: "#d4d4d8", fontWeight: 500 }}>Instant</span></div>
                  </div>
                </div>
              </div>

            </motion.div>


            {/* --- MOBILE HOME REPLICA --- */}
            <div className="mobile-only mobile-gradient-bg" style={{ padding: "32px 20px 100px", minHeight: "100%" }}>
              
              <div style={{ position: "absolute", top: 40, right: 0, width: "70%", height: 180, opacity: 0.1, backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Dedan_Kimathi_University_of_Technology_Library.jpg/1200px-Dedan_Kimathi_University_of_Technology_Library.jpg')", backgroundSize: "cover", backgroundPosition: "right center", maskImage: "linear-gradient(to left, rgba(0,0,0,1), transparent)", WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1), transparent)", zIndex: 0 }} />

              <div style={{ position: "relative", zIndex: 10 }}>
                <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, color: "#fff", marginBottom: 12, letterSpacing: "-0.03em" }}>
                  Find Official DeKUT <br/>
                  <span style={{ color: "#8b5cf6" }}>Information Instantly</span>
                </h1>
                <p style={{ color: "#a1a1aa", fontSize: 15, marginBottom: 32 }}>Accurate answers. Verified sources. Trusted by all.</p>

                {/* Search Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 100, padding: "8px 8px 8px 24px", border: "1px solid #8b5cf6", background: "rgba(0,0,0,0.4)", marginBottom: 24, boxShadow: "0 8px 32px rgba(139, 92, 246, 0.1)" }}>
                  <Search size={22} style={{ color: "#8b5cf6" }} />
                  <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Ask any university question..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#fff" }} />
                  <motion.button onClick={() => ask()} style={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", border: "none", background: "#8b5cf6", color: "#fff" }}>
                    <Send size={18} style={{ marginLeft: -2, transform: "rotate(45deg)" }} />
                  </motion.button>
                </div>

                {/* Trust Badges */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={16} style={{ color: "#8b5cf6" }} /><span style={{ fontSize: 11, color: "#d4d4d8", fontWeight: 500 }}>Official Sources</span></div>
                  <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={16} style={{ color: "#8b5cf6" }} /><span style={{ fontSize: 11, color: "#d4d4d8", fontWeight: 500 }}>Accurate Answers</span></div>
                  <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap size={16} style={{ color: "#8b5cf6" }} /><span style={{ fontSize: 11, color: "#d4d4d8", fontWeight: 500 }}>Instant Responses</span></div>
                </div>

                {/* Popular Questions */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Popular Questions</h3>
                    <span style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 600 }}>View All</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                    {["How do I register for units?", "How do I clear my fee balance?", "Are internal hostels available?", "When are CAT results released?"].map((q, i, arr) => (
                      <div key={i} onClick={() => ask(q)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i !== arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer" }}>
                        <MessageSquare size={18} style={{ color: "#8b5cf6" }} />
                        <span style={{ flex: 1, fontSize: 14, color: "#ececec" }}>{q}</span>
                        <ChevronRight size={18} style={{ color: "#52525b" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Access */}
                <div style={{ marginBottom: 40 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Quick Access</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, overflowX: "auto" }} className="hide-scroll">
                    {[
                      { l: "Academics", i: GraduationCap },
                      { l: "Fees", i: Wallet },
                      { l: "Accommodation", i: Home },
                      { l: "Admissions", i: FileText },
                      { l: "Library", i: BookOpen },
                      { l: "Support", i: HeadphonesIcon }
                    ].map((btn, i) => (
                      <div key={i} style={{ width: 80, height: 80, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <btn.i size={24} style={{ color: "#8b5cf6" }} />
                        <span style={{ fontSize: 10, color: "#ececec", fontWeight: 500 }}>{btn.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Continue</h3>
                    <span style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 600 }}>View All</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                    {conversations.slice(0, 3).map((c, i, arr) => (
                      <div key={c.id} onClick={() => loadConv(c.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i !== arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <Clock size={16} style={{ color: "#8b5cf6" }} />
                        <span style={{ flex: 1, fontSize: 14, color: "#ececec", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                        <span style={{ fontSize: 12, color: "#52525b" }}>{formatRelTime(c.createdAt)}</span>
                        <ChevronRight size={18} style={{ color: "#52525b" }} />
                      </div>
                    ))}
                    {conversations.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#52525b", fontSize: 13 }}>No recent chats.</div>}
                  </div>
                </div>

                {/* Powered By Banner */}
                <div style={{ padding: "20px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(139, 92, 246, 0.05)", display: "flex", alignItems: "flex-start", gap: 16, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", bottom: -20, right: -20, opacity: 0.1, zIndex: 0 }}>
                    <Building2 size={120} />
                  </div>
                  <FileText size={24} style={{ color: "#8b5cf6", flexShrink: 0, position: "relative", zIndex: 10 }} />
                  <div style={{ position: "relative", zIndex: 10 }}>
                    <b style={{ display: "block", fontSize: 13, color: "#fff", marginBottom: 4 }}>Powered by Official University Documents</b>
                    <span style={{ fontSize: 11, color: "#a1a1aa", lineHeight: 1.4 }}>Answers generated from verified DeKUT regulations, policies, notices and official resources.</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        ) : tab === "Chats" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", paddingBottom: 80 }}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 120px", width: "100%" }}>
                {messages.map((m) => (
                  <div key={m.id} style={{ marginBottom: 40 }}>
                    {m.role === "user" ? (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div className="glass-panel" style={{ maxWidth: "80%", borderRadius: 24, borderBottomRightRadius: 8, padding: "14px 20px", fontSize: 15, background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "#fff" }}>{m.content}</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 12, overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, background: "rgba(255,255,255,0.05)" }}>
                          <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, color: "#ececec", lineHeight: 1.7 }}><MarkdownMessage content={m.content} /></div>
                          
                          {m.sources && m.sources.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                              <span style={{ fontSize: 11, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 4 }}><ShieldCheck size={12} /> Sources:</span>
                              {m.sources.map((s, idx) => (
                                <span key={idx} style={{ background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#8b5cf6", display: "flex", alignItems: "center", gap: 4 }}>
                                  <FileText size={10} /> {s.title} {s.page ? `(Pg. ${s.page})` : ""}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                            <button onClick={() => toggleReadAloud(m.id, m.content)} title={readingMsgId === m.id ? "Stop reading" : "Read aloud"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", color: readingMsgId === m.id ? "#ef4444" : "#a1a1aa", cursor: "pointer", transition: "0.2s" }}>
                              {readingMsgId === m.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            <button onClick={() => escalateToHuman(m.content)} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 100, padding: "6px 12px", color: "#ef4444", fontSize: 12, cursor: "pointer", transition: "0.2s" }}>
                              <HeadphonesIcon size={14} /> Escalate to Human
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {asking && <div style={{ display: "flex", gap: 16 }}><div style={{ width: 8, height: 8, background: "#8b5cf6", borderRadius: "50%" }} /></div>}
              </div>
            </div>

            <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, padding: "0 20px", background: "linear-gradient(to top, rgba(6,8,10,1) 70%, transparent)" }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <div className="glass-panel" style={{ display: "flex", alignItems: "flex-end", gap: 12, borderRadius: 24, padding: "12px 14px" }}>
                  <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} placeholder="Ask anything about DeKUT…" rows={1} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 16, color: "#fff", minHeight: 32, maxHeight: 200 }} />
                  <motion.button onClick={() => ask()} disabled={!query.trim() || asking} style={{ width: 40, height: 40, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: query.trim() ? "#8b5cf6" : "rgba(255,255,255,0.1)", border: "none" }}><Send size={18} color="#fff" /></motion.button>
                </div>
              </div>
            </div>
          </div>
        ) : tab === "Documents" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>Official Documents</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Search size={16} color="#a1a1aa" />
                  <input value={docQuery} onChange={e => setDocQuery(e.target.value)} placeholder="Search..." style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 14 }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {documents.filter(d => d.title.toLowerCase().includes(docQuery.toLowerCase())).map(doc => (
                  <div key={doc.id} className="glass-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: doc.file_type === 'pdf' ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)", display: "grid", placeItems: "center" }}>
                        {doc.file_type === "pdf" ? <FileText size={20} color="#ef4444" /> : <FileIcon size={20} color="#3b82f6" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: "#fff", display: "block", marginBottom: 4 }}>{doc.title}</span>
                        <span style={{ fontSize: 11, color: "#8b5cf6", background: "rgba(139, 92, 246, 0.1)", padding: "4px 8px", borderRadius: 12, border: "1px solid rgba(139,92,246,0.2)" }}>{doc.category}</span>
                      </div>
                    </div>
                    <button style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer", width: "fit-content" }}><Download size={14} /> Download</button>
                  </div>
                ))}
                {documents.length === 0 && <p style={{ color: "#a1a1aa" }}>No documents found.</p>}
              </div>
            </div>
          </div>
        ) : tab === "Notices" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 100 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 32 }}>Campus Notices</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {notices.map(notice => (
                  <div key={notice.id} className="glass-panel" style={{ padding: 24, borderLeft: "4px solid #8b5cf6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{notice.title}</h3>
                      <span style={{ fontSize: 12, color: "#a1a1aa" }}>{new Date(notice.published_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ color: "#ececec", fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>{notice.summary || notice.body}</p>
                    {notice.category && <span style={{ fontSize: 11, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 12 }}>{notice.category}</span>}
                  </div>
                ))}
                {notices.length === 0 && <p style={{ color: "#a1a1aa" }}>No new notices.</p>}
              </div>
            </div>
          </div>
        ) : tab === "Support" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
              
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 24 }}>IT Support</h2>
                <div className="glass-panel" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Create New Ticket</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <select value={ticketDeptId} onChange={e => setTicketDeptId(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 14, appearance: "none" }}>
                      <option value="">Select Department (Optional)</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Subject (e.g. WiFi Issue)" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 14 }} />
                    <textarea value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} placeholder="Describe your issue..." rows={4} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 14, resize: "none" }} />
                    <button onClick={handleCreateTicket} disabled={creatingTicket || !ticketSubject || !ticketDesc} style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, opacity: (creatingTicket || !ticketSubject || !ticketDesc) ? 0.5 : 1 }}>
                      {creatingTicket ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 24, marginTop: 10 }}>Your Tickets</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="glass-panel" style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{ticket.subject}</span>
                        <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 12, fontWeight: 600, textTransform: "uppercase",
                          background: ticket.status === 'open' ? "rgba(245, 158, 11, 0.1)" : ticket.status === 'resolved' ? "rgba(139, 92, 246, 0.1)" : "rgba(59, 130, 246, 0.1)",
                          color: ticket.status === 'open' ? "#f59e0b" : ticket.status === 'resolved' ? "#8b5cf6" : "#3b82f6"
                        }}>{ticket.status}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#a1a1aa", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ticket.description}</p>
                    </div>
                  ))}
                  {tickets.length === 0 && <p style={{ color: "#a1a1aa", fontSize: 14 }}>No tickets submitted.</p>}
                </div>
              </div>

            </div>
          </div>
        ) : tab === "Class Schedules" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 100 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>Class Schedules</h2>
                <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#8b5cf6", color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  Upload Image/PDF
                  <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleUploadTimetable} disabled={uploading} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
                {timetables.map(t => (
                  <div key={t.id} className="glass-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <CalendarDays color="#8b5cf6" size={24} />
                      <span style={{ fontWeight: 600, fontSize: 15, flex: 1, color: "#fff" }}>{t.title}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#8b5cf6", background: "rgba(139, 92, 246, 0.1)", padding: "4px 8px", borderRadius: 12, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}>
                      <ClockIcon size={12} /> {t.processing_status}
                    </span>
                  </div>
                ))}
                {timetables.length === 0 && (
                  <div className="glass-panel" style={{ padding: 40, gridColumn: "1 / -1", textAlign: "center" }}>
                    <CalendarDays size={48} color="#52525b" style={{ margin: "0 auto 16px" }} />
                    <h3 style={{ fontSize: 16, color: "#fff", marginBottom: 8 }}>No Timetable Yet</h3>
                    <p style={{ color: "#a1a1aa", fontSize: 14 }}>Upload a picture of your class timetable, and our AI will automatically parse it and notify you before classes!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : tab === "Profile" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 32 }}>My Profile</h2>
              <div className="glass-panel" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #059669)", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 16, boxShadow: "0 8px 32px rgba(139,92,246,0.3)" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{name}</h3>
                <span style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 8 }}>{profile?.email}</span>
                <span style={{ fontSize: 12, color: "#8b5cf6", background: "rgba(139, 92, 246, 0.1)", padding: "4px 12px", borderRadius: 100, fontWeight: 600, textTransform: "uppercase", border: "1px solid rgba(139,92,246,0.2)" }}>Lecturer Account</span>
                
                <hr style={{ width: "100%", border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "32px 0" }} />
                
                <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "12px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "center" }}>
                  <LogOut size={18} /> Sign Out securely
                </button>
              </div>
            </div>
          </div>
        ) : tab === "Settings" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 32 }}>Settings</h2>
              
              <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Language & Localization</h3>
                <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 24 }}>Choose the preferred language for KiliGuide AI to communicate with you.</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={() => handleUpdateLanguage("en")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: language === "en" ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: 12, cursor: "pointer", transition: "0.2s" }}>
                    <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>English</span>
                    {language === "en" && <CheckCircle2 size={18} color="#8b5cf6" />}
                  </button>
                  <button onClick={() => handleUpdateLanguage("sw")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: language === "sw" ? "1px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: 12, cursor: "pointer", transition: "0.2s" }}>
                    <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>Kiswahili</span>
                    {language === "sw" && <CheckCircle2 size={18} color="#8b5cf6" />}
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </section>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="mobile-only" style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 80, background: "#0B0F14", borderTop: "1px solid rgba(255,255,255,0.05)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-around", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { id: "Home" as Tab, icon: Home },
          { id: "Chats" as Tab, icon: MessageCircleMore },
          { id: "Documents" as Tab, icon: FileText },
          { id: "Profile" as Tab, icon: User },
        ].map(item => {
          const isActive = tab === item.id || (tab === "Chats" && activeConvId && item.id === "Chats");
          return (
            <button key={item.id} onClick={() => switchTab(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "transparent", border: "none", color: isActive ? "#8b5cf6" : "#8e8ea0", position: "relative", width: 60 }}>
              {isActive && <div style={{ position: "absolute", top: -16, width: 40, height: 3, background: "#8b5cf6", borderRadius: "0 0 4px 4px", boxShadow: "0 4px 12px rgba(139,92,246,0.5)" }} />}
              <item.icon size={22} style={{ color: isActive ? "#8b5cf6" : "#8e8ea0" }} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.id === "Chats" ? "Chat" : item.id}</span>
            </button>
          );
        })}
      </nav>

    </main>
  );
}

