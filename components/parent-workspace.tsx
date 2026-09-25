"use client";
import { useEffect, useState, useRef } from "react";
import { MarkdownRender as MarkdownMessage } from "./markdown-render";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Bell, BookOpen, BookOpenCheck, Building2, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock, Clock as ClockIcon, Download, File as FileIcon, FileText, GraduationCap, HeadphonesIcon, Home, Image as ImageIcon, Landmark, Loader2, Lock, LogOut, Menu, MessageCircleMore, MessageSquare, PanelLeft, PanelLeftClose, Plus, Search, Send, Settings, ShieldCheck, Sparkles, Ticket, Trash2, UploadCloud, User, UserX, Volume2, VolumeX, Wallet, X, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";
import { InstallButton } from "./install-button";
import { getTranslation } from "../lib/translations";

type Tab = "Home" | "Chats" | "Documents" | "Notices" | "Fee Statements" | "Support" | "Profile" | "Settings";
const navigation: [Tab, any][] = [
  ["Home", Home],
  ["Chats", MessageCircleMore],
  ["Documents", FileText],
  ["Notices", Bell],
  ["Fee Statements", Wallet],
  ["Support", Ticket],
  ["Settings", Settings],
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



import { EscalateModal } from "./escalate-modal";
import { TicketChatModal } from "./ticket-chat-modal";

export function ParentWorkspace() {
  const [tab, setTab] = useState<Tab>("Home");
  const [escalatePayload, setEscalatePayload] = useState<{subject: string, body: string} | null>(null);
  const [activeTicketChatId, setActiveTicketChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [name, setName] = useState("Parent");
  const [institutionName, setInstitutionName] = useState<string>("");
  const instShortName = !institutionName
    ? "Campus"
    : institutionName.includes("Dedan Kimathi")
    ? "DeKUT"
    : institutionName.split(" ").filter(w => w.length > 0).map(w => w[0]).join("").toUpperCase().slice(0, 6) || "University";
  const [showDocuments, setShowDocuments] = useState(false);
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
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kiliguide_language") || "en";
    }
    return "en";
  });
  const tr = getTranslation(language);
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
      setName(user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Parent");
      if (user && supabase) {
        const { data: prof } = await supabase.from("profiles").select("preferred_language, institution_id").eq("id", user.id).single();
        if (prof?.preferred_language) setLanguage(prof.preferred_language);
        const effectiveInstId = prof?.institution_id || user?.user_metadata?.institution_id;
        if (effectiveInstId) {
          const { data: inst } = await supabase.from("institutions").select("name").eq("id", effectiveInstId).single();
          if (inst?.name) setInstitutionName(inst.name);
        }
        
        const { data: settings } = await supabase.from("system_settings").select("value").eq("key", "show_documents_to_users").single();
        if (settings && settings.value === 'true') setShowDocuments(true);
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
    if (!error && data && data[0]) {
      setTickets([data[0], ...tickets]);
      setTicketSubject("");
      setTicketDesc("");
      setTicketDeptId("");
      setActiveTicketChatId(data[0].id);
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
    try {
      localStorage.removeItem("kiliguide_user_role");
      localStorage.removeItem("kiliguide-auth-token");
    } catch (_) {}
    if (supabase) {
      await supabase.auth.signOut().catch(() => undefined);
    }
    window.location.href = "/login";
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to PERMANENTLY DELETE your account? All your personal settings and profile data will be erased. This action CANNOT be undone."
    );
    if (!confirmDelete) return;

    try {
      if (supabase) {
        const { error } = await supabase.rpc("delete_user_account");
        if (error) {
          console.warn("RPC delete_user_account error:", error.message);
          if (profile?.id) {
            await supabase.from("profiles").delete().eq("id", profile.id);
          }
        }
        await supabase.auth.signOut().catch(() => undefined);
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
    } finally {
      localStorage.removeItem("kiliguide_user_role");
      localStorage.removeItem("kiliguide-auth-token");
      window.location.href = "/login";
    }
  };
  
  const handleUpdateLanguage = async (lang: string) => {
    setLanguage(lang);
    try { localStorage.setItem("kiliguide_language", lang); } catch (_) {}
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
      utterance.lang = language === "sw" ? "sw-KE" : "en-KE";
      utterance.onend = () => setReadingMsgId(null);
      utterance.onerror = () => setReadingMsgId(null);
      window.speechSynthesis.speak(utterance);
      setReadingMsgId(msgId);
    }
  };

  const escalateToHuman = (msgContent: string) => {
    const subject = `Question about: ${activeConv?.title || 'KiliGuide Answer'}`;
    const body = msgContent;
    setEscalatePayload({ subject, body });
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
    let { data, error } = await supabase.functions.invoke("chat", { body: { question: finalQuery, conversationId: convId } });

    if (data?.escalate) {
       const tempId = Date.now().toString() + "-temp";
       setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, { id: tempId, role: "assistant", content: "Thinking & searching university knowledge base..." }] } : c));
       
       const fallbackRes = await supabase.functions.invoke("chat", { body: { question: finalQuery, conversationId: convId, forceWebSearch: true } });
       data = fallbackRes.data;
       error = fallbackRes.error;
       
       setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c));
    }
    
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "rgba(10, 14, 20, 0.94)", backdropFilter: "blur(24px)", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* 1. Header & Brand */}
      <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", display: "grid", placeItems: "center", background: "rgba(249, 115, 22, 0.12)", border: "1px solid rgba(249, 115, 22, 0.25)" }}>
              <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
            </span>
            <div>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>KiliGuide</span>
              <span style={{ display: "block", fontSize: 11, color: "#a1a1aa", marginTop: 1, fontWeight: 500 }}>Parent Portal</span>
            </div>
          </div>
          {mobileSidebar && (
            <button onClick={() => setMobileSidebar(false)} style={{ padding: 6, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#a1a1aa", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* ChatGPT "+ New Chat" Button */}
        <motion.button 
          whileHover={{ scale: 1.01, backgroundColor: "rgba(249, 115, 22, 0.18)" }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => { setActiveConvId(null); setTab("Chats"); setMobileSidebar(false); }} 
          style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 8, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, background: "rgba(249, 115, 22, 0.12)", color: "#ffffff", border: "1px solid rgba(249, 115, 22, 0.3)", cursor: "pointer", transition: "all 0.2s ease" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} style={{ color: "#f97316" }} /> <span>New Chat</span>
          </div>
          <span style={{ fontSize: 10, opacity: 0.9, background: "rgba(249,115,22,0.2)", color: "#f97316", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>Ctrl+K</span>
        </motion.button>
      </div>

      {/* 2. Main Scrollable Container */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
        
        {/* Navigation / Workspace Tools */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px 8px" }}>
            Navigation
          </div>
          {navigation.filter(([lbl]) => lbl !== "Documents" || showDocuments).map(([label, Icon]) => {
            const isActive = tab === label && !(label === "Chats" && !activeConvId);
            return (
              <button 
                key={label} 
                onClick={() => switchTab(label)}
                style={{ 
                  display: "flex", 
                  width: "100%", 
                  alignItems: "center", 
                  gap: 10, 
                  borderRadius: 10, 
                  padding: "9px 12px", 
                  fontSize: 13, 
                  fontWeight: isActive ? 600 : 500, 
                  background: isActive ? "rgba(249, 115, 22, 0.14)" : "transparent", 
                  color: isActive ? "#ffffff" : "#d4d4d8", 
                  border: isActive ? "1px solid rgba(249, 115, 22, 0.3)" : "1px solid transparent", 
                  cursor: "pointer", 
                  marginBottom: 3, 
                  transition: "all 0.15s ease" 
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={16} style={{ color: isActive ? "#f97316" : "#a1a1aa", flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
              </button>
            );
          })}
          <InstallButton style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 500, color: "#d4d4d8", cursor: "pointer", marginBottom: 3 }} />
        </div>

        {/* ChatGPT-style Recent Conversations */}
        {conversations.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px 8px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Recent Chats
              </span>
              <span style={{ fontSize: 10, color: "#71717a", fontWeight: 600 }}>{conversations.length}</span>
            </div>
            
            {groups.today.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#71717a", padding: "2px 8px 6px", fontWeight: 500 }}>Today</div>
                {groups.today.map(c => {
                  const isActive = activeConvId === c.id && tab === "Chats";
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => loadConv(c.id)} 
                      className="conv-item" 
                      style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "7px 10px", cursor: "pointer", background: isActive ? "rgba(249, 115, 22, 0.12)" : "transparent", border: isActive ? "1px solid rgba(249, 115, 22, 0.25)" : "1px solid transparent", marginBottom: 2 }}
                    >
                      <MessageSquare size={14} style={{ color: isActive ? "#f97316" : "#71717a", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? "#ffffff" : "#d4d4d8", fontWeight: isActive ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                      <button onClick={(e) => deleteConv(c.id, e)} className="del-btn" style={{ opacity: 0, color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom ChatGPT-Style User Profile Bar */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.2)" }}>
        <button onClick={() => switchTab("Profile")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: "4px", borderRadius: 8, textAlign: "left", minWidth: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #ea580c)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 2px 8px rgba(249,115,22,0.3)" }}>
            {name.charAt(0).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ffffff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{name}</span>
            <span style={{ display: "block", fontSize: 10, color: "#a1a1aa", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Parent Account</span>
          </div>
        </button>
        
        <button onClick={() => switchTab("Settings")} title="Settings" style={{ padding: 7, borderRadius: 8, background: tab === "Settings" ? "rgba(249, 115, 22, 0.2)" : "rgba(255,255,255,0.05)", border: tab === "Settings" ? "1px solid rgba(249, 115, 22, 0.3)" : "1px solid rgba(255,255,255,0.08)", color: tab === "Settings" ? "#f97316" : "#a1a1aa", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Settings size={16} />
        </button>

        <button onClick={handleSignOut} title="Sign Out" style={{ padding: 7, borderRadius: 8, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <main className="bg-aurora" style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", color: "#ececec" }}>
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
          background: radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.15) 0%, transparent 60%);
        }
      `}</style>

      <aside className="desktop-only glass-panel" style={{ width: sidebarOpen ? 280 : 0, transition: "width 0.4s", flexShrink: 0, flexDirection: "column", overflow: "hidden", borderRadius: 24, borderTop: "none", borderBottom: "none", borderLeft: "none", margin: "12px 0 12px 12px", height: "calc(100vh - 24px)" }}>
        <div style={{ width: 280, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column" }}>
          <SidebarContent />
        </div>
      </aside>

      {mobileSidebar && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebar(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="glass-panel" style={{ position: "fixed", inset: "12px auto 12px 12px", width: 280, zIndex: 50, display: "flex", flexDirection: "column", height: "calc(100vh - 24px)", borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <SidebarContent />
          </motion.aside>
        </AnimatePresence>
      )}

      <section style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", position: "relative", zIndex: 10 }}>
        
        <header className="desktop-only" style={{ margin: "20px 28px 0", padding: "12px 24px", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, rgba(20, 26, 36, 0.85) 0%, rgba(12, 17, 24, 0.75) 100%)", backdropFilter: "blur(28px) saturate(190%)", WebkitBackdropFilter: "blur(28px) saturate(190%)", borderRadius: 22, border: "1px solid rgba(255, 255, 255, 0.12)", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 30px rgba(249, 115, 22, 0.04)", flexShrink: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.95 }} onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} style={{ padding: 10, borderRadius: 14, color: "#e4e4e7", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </motion.button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 14, background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.01em" }}>
              <Sparkles size={15} style={{ color: "#fb923c" }} />
              <span>Parent Portal ({tab})</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, background: "linear-gradient(135deg, rgba(249, 115, 22, 0.14) 0%, rgba(234, 88, 12, 0.06) 100%)", border: "1px solid rgba(251, 146, 60, 0.3)", boxShadow: "0 0 20px rgba(249, 115, 22, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)", fontSize: 12, fontWeight: 600, color: "#fb923c", letterSpacing: "-0.01em" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
              </span>
              Parent Portal Online
            </div>

            <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(249, 115, 22, 0.35), inset 0 1px 0 rgba(255,255,255,0.3)" }} whileTap={{ scale: 0.97 }} onClick={()=>ask()} className="glass-button" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 14, background: "linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(234, 88, 12, 0.14) 100%)", color: "#fb923c", border: "1px solid rgba(251, 146, 60, 0.4)", boxShadow: "0 0 18px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <Sparkles size={15} style={{ color: "#fb923c" }} /> <span>Ask KiliGuide</span>
            </motion.button>

            <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.95 }} onClick={()=>switchTab("Notices")} title="Notices" style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#e4e4e7", cursor: "pointer", position: "relative", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={18} />
              {notices.length > 0 && <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 10px #f97316" }} />}
            </motion.button>

            <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }} whileTap={{ scale: 0.95 }} onClick={()=>switchTab("Settings")} title="Settings" style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#e4e4e7", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Settings size={18} />
            </motion.button>
          </div>
        </header>

        <header className="mobile-only" style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", flexShrink: 0, zIndex: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(11, 15, 20, 0.85)", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setMobileSidebar(true)} style={{ padding: 8, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#ececec", display: "grid", placeItems: "center" }}>
            <Menu size={20} />
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 12px", cursor: "pointer" }} onClick={() => setTab("Home")}>
            <Sparkles size={14} style={{ color: "#f97316" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>KiliGuide AI</span>
          </div>

          <button onClick={() => { setActiveConvId(null); setTab("Chats"); }} style={{ padding: 8, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#ececec", display: "grid", placeItems: "center" }} title="New Chat">
            <Plus size={20} />
          </button>
        </header>

        {/* Dynamic Content */}
        {tab === "Home" ? (
          <div style={{ flex: 1, overflowY: "auto", position: "relative" }} className="hide-scroll">
            
            {/* --- DESKTOP HOME (ASYMMETRIC BENTO GRID DASHBOARD) --- */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="desktop-only" style={{ padding: "28px 28px 100px", maxWidth: 1360, margin: "0 auto" }}>
              
              {/* Top Welcome Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    Welcome, <span style={{ color: "#f97316" }}>{name.split(" ")[0]}</span> 🏡
                  </h1>
                  <p style={{ color: "#a1a1aa", fontSize: 14 }}>{instShortName} Parent & Guardian Portal • Academic Year 2026/2027</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="glass-panel" style={{ padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#f97316", display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={16} /> Verified Parent Account
                  </div>
                </div>
              </div>

              {/* 3-Column Bento Grid Layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
                
                {/* LEFT & CENTER COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  
                  {/* Ask KiliGuide Hero AI Bar */}
                  <div className="glass-panel" style={{ padding: 32, border: "none", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Sparkles size={20} style={{ color: "#f97316" }} />
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Parent AI Assistant & Information Hub</h2>
                      </div>
                      <span style={{ fontSize: 11, color: "#a1a1aa", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 6 }}>Official {instShortName} Portal</span>
                    </div>
                    
                    <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 20 }}>Instant guidance on tuition fee payment steps, bank account details, hostel safety, and academic semester calendars.</p>
                    
                    <div className="glass-input" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px 10px 20px" }}>
                      <Search size={18} style={{ color: "#f97316" }} />
                      <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Ask about fee bank details, semester closing dates, graduation requirements..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#fff" }} />
                      <motion.button onClick={() => ask()} disabled={!query.trim()} style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", border: "none", background: query.trim() ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" : "rgba(255,255,255,0.08)", color: "#fff", cursor: query.trim() ? "pointer" : "not-allowed" }}>
                        <Send size={15} style={{ transform: "rotate(45deg)", marginLeft: -1 }} />
                      </motion.button>
                    </div>

                    {/* Quick Suggestions for Parents */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                      {[
                        "How do I clear student fees?",
                        `${instShortName} official bank accounts?`,
                        "Semester exam dates & calendar",
                        "Hostel booking guidelines"
                      ].map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => ask(promptText)}
                          style={{ fontSize: 12, color: "#d4d4d8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", transition: "all 0.15s" }}
                          className="hover:border-[#f97316]/40 hover:text-white"
                        >
                          🏡 {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Access Grid */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#71717a", marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Parent Quick Tools</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      
                      <motion.div whileHover={{ y: -3 }} onClick={() => ask("How do I clear my fee balance and get bank accounts?")} className="glass-panel" style={{ padding: 20, cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(249, 115, 22, 0.15)", display: "grid", placeItems: "center" }}>
                          <Wallet size={20} style={{ color: "#f97316" }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Fee Clearance & Bank Accounts</span>
                        <span style={{ fontSize: 12, color: "#a1a1aa" }}>Official payment channels & receipts</span>
                      </motion.div>

                      <motion.div whileHover={{ y: -3 }} onClick={() => ask("What are the academic rules and unit registration deadlines?")} className="glass-panel" style={{ padding: 20, cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16, 185, 129, 0.15)", display: "grid", placeItems: "center" }}>
                          <GraduationCap size={20} style={{ color: "#10b981" }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Academic Progression</span>
                        <span style={{ fontSize: 12, color: "#a1a1aa" }}>Unit registration & exam rules</span>
                      </motion.div>

                      <motion.div whileHover={{ y: -3 }} onClick={() => ask("Are there internal hostels available?")} className="glass-panel" style={{ padding: 20, cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(56, 189, 248, 0.15)", display: "grid", placeItems: "center" }}>
                          <Home size={20} style={{ color: "#38bdf8" }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Hostel & Housing</span>
                        <span style={{ fontSize: 12, color: "#a1a1aa" }}>On-campus & off-campus rentals</span>
                      </motion.div>

                    </div>
                  </div>

                  {/* Recent Discussions */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#71717a", letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent AI Discussions</h3>
                      <button onClick={() => switchTab("Chats")} style={{ background: "transparent", border: "none", color: "#f97316", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All ({conversations.length}) →</button>
                    </div>

                    <div className="glass-panel" style={{ padding: "8px 0", border: "none" }}>
                      {conversations.slice(0, 4).map((c, idx) => (
                        <div key={c.id} onClick={() => loadConv(c.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", cursor: "pointer", borderBottom: idx < Math.min(conversations.length - 1, 3) ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <MessageSquare size={16} style={{ color: "#f97316", flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 14, color: "#ececec", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                          <span style={{ fontSize: 12, color: "#71717a" }}>{formatRelTime(c.createdAt)}</span>
                          <ChevronRight size={14} style={{ color: "#52525b" }} />
                        </div>
                      ))}
                      {conversations.length === 0 && <p style={{ color: "#71717a", fontSize: 13, padding: "16px 20px" }}>No recent discussions.</p>}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  
                  {/* Official Notices */}
                  <div className="glass-panel" style={{ padding: 22, border: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bell size={18} style={{ color: "#f97316" }} />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>University Announcements</h3>
                      </div>
                      <span style={{ fontSize: 10, background: "rgba(249, 115, 22, 0.15)", color: "#f97316", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>PARENTS</span>
                    </div>

                    {notices.length > 0 ? (
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{notices[0].title}</h4>
                        <p style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 12 }}>{notices[0].summary || notices[0].body}</p>
                        <button onClick={() => switchTab("Notices")} style={{ background: "transparent", border: "none", color: "#f97316", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Read Announcement →</button>
                      </div>
                    ) : (
                      <p style={{ color: "#71717a", fontSize: 12 }}>No published announcements.</p>
                    )}
                  </div>

                  {/* Fee Payment Status */}
                  <div className="glass-panel" style={{ padding: 22, border: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <Wallet size={18} style={{ color: "#f97316" }} />
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Tuition & Fee Status</h3>
                    </div>
                    
                    <div style={{ padding: "12px", borderRadius: 12, background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.2)", marginBottom: 14 }}>
                      <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700, textTransform: "uppercase" }}>Payment Verification</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", display: "block", marginTop: 2 }}>
                        Verified {instShortName} Account Channels
                      </span>
                    </div>

                    <button onClick={() => switchTab("Fee Statements")} style={{ width: "100%", padding: "10px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      View Fee Guides <ChevronRight size={15} />
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>


            {/* --- MOBILE HOME REPLICA --- */}
            <div className="mobile-only mobile-gradient-bg" style={{ padding: "32px 20px 100px", minHeight: "100%" }}>
              
              <div style={{ position: "absolute", top: 40, right: 0, width: "70%", height: 180, opacity: 0.1, backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Dedan_Kimathi_University_of_Technology_Library.jpg/1200px-Dedan_Kimathi_University_of_Technology_Library.jpg')", backgroundSize: "cover", backgroundPosition: "right center", maskImage: "linear-gradient(to left, rgba(0,0,0,1), transparent)", WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1), transparent)", zIndex: 0 }} />

              <div style={{ position: "relative", zIndex: 10 }}>
                <h1 style={{ fontSize: "clamp(22px, 5.5vw, 30px)", fontWeight: 800, lineHeight: 1.15, color: "#fff", marginBottom: 10, letterSpacing: "-0.03em" }}>
                  Find Official {instShortName} <br className="hidden sm:inline" />
                  <span style={{ color: "#f97316" }}>Information Instantly</span>
                </h1>
                <p style={{ color: "#a1a1aa", fontSize: 15, marginBottom: 32 }}>Accurate answers. Verified sources. Trusted by all.</p>

                {/* Search Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 100, padding: "8px 8px 8px 24px", border: "1px solid #f97316", background: "rgba(0,0,0,0.4)", marginBottom: 24, boxShadow: "0 8px 32px rgba(249, 115, 22, 0.1)" }}>
                  <Search size={22} style={{ color: "#f97316" }} />
                  <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Ask any university question..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#fff" }} />
                  <motion.button onClick={() => ask()} style={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", border: "none", background: "#f97316", color: "#fff" }}>
                    <Send size={18} style={{ marginLeft: -2, transform: "rotate(45deg)" }} />
                  </motion.button>
                </div>

                {/* Trust Badges */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={16} style={{ color: "#f97316" }} /><span style={{ fontSize: 11, color: "#d4d4d8", fontWeight: 500 }}>Official Sources</span></div>
                  <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={16} style={{ color: "#f97316" }} /><span style={{ fontSize: 11, color: "#d4d4d8", fontWeight: 500 }}>Accurate Answers</span></div>
                  <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap size={16} style={{ color: "#f97316" }} /><span style={{ fontSize: 11, color: "#d4d4d8", fontWeight: 500 }}>Instant Responses</span></div>
                </div>

                {/* Popular Questions */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Popular Questions</h3>
                    <span style={{ fontSize: 12, color: "#f97316", fontWeight: 600 }}>View All</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                    {["How do I register for units?", "How do I clear my fee balance?", "Are internal hostels available?", "When are CAT results released?"].map((q, i, arr) => (
                      <div key={i} onClick={() => ask(q)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i !== arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer" }}>
                        <MessageSquare size={18} style={{ color: "#f97316" }} />
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
                        <btn.i size={24} style={{ color: "#f97316" }} />
                        <span style={{ fontSize: 10, color: "#ececec", fontWeight: 500 }}>{btn.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue */}
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Continue</h3>
                    <span style={{ fontSize: 12, color: "#f97316", fontWeight: 600 }}>View All</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                    {conversations.slice(0, 3).map((c, i, arr) => (
                      <div key={c.id} onClick={() => loadConv(c.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i !== arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <Clock size={16} style={{ color: "#f97316" }} />
                        <span style={{ flex: 1, fontSize: 14, color: "#ececec", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                        <span style={{ fontSize: 12, color: "#52525b" }}>{formatRelTime(c.createdAt)}</span>
                        <ChevronRight size={18} style={{ color: "#52525b" }} />
                      </div>
                    ))}
                    {conversations.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#52525b", fontSize: 13 }}>No recent chats.</div>}
                  </div>
                </div>

                {/* Powered By Banner */}
                <div style={{ padding: "20px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(249, 115, 22, 0.05)", display: "flex", alignItems: "flex-start", gap: 16, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", bottom: -20, right: -20, opacity: 0.1, zIndex: 0 }}>
                    <Building2 size={120} />
                  </div>
                  <FileText size={24} style={{ color: "#f97316", flexShrink: 0, position: "relative", zIndex: 10 }} />
                  <div style={{ position: "relative", zIndex: 10 }}>
                    <b style={{ display: "block", fontSize: 13, color: "#fff", marginBottom: 4 }}>Powered by Official University Documents</b>
                    <span style={{ fontSize: 11, color: "#a1a1aa", lineHeight: 1.4 }}>Answers generated from verified {instShortName} regulations, policies, notices and official resources.</span>
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
                        <div className="glass-panel" style={{ maxWidth: "80%", borderRadius: 24, borderBottomRightRadius: 8, padding: "14px 20px", fontSize: 15, background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.3)", color: "#fff" }}>{m.content}</div>
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
                                <span key={idx} style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.2)", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#f97316", display: "flex", alignItems: "center", gap: 4 }}>
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
                {asking && <div style={{ display: "flex", gap: 16 }}><div style={{ width: 8, height: 8, background: "#f97316", borderRadius: "50%" }} /></div>}
              </div>
            </div>

            <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, padding: "0 20px", background: "transparent" }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <div className="glass-panel" style={{ display: "flex", alignItems: "flex-end", gap: 12, borderRadius: 24, padding: "12px 14px" }}>
                  <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} placeholder={`Ask anything about ${instShortName}…`} rows={1} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 16, color: "#fff", minHeight: 32, maxHeight: 200 }} />
                  <motion.button onClick={() => ask()} disabled={!query.trim() || asking} style={{ width: 40, height: 40, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: query.trim() ? "#f97316" : "rgba(255,255,255,0.1)", border: "none" }}><Send size={18} color="#fff" /></motion.button>
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
                        <span style={{ fontSize: 11, color: "#f97316", background: "rgba(249, 115, 22, 0.1)", padding: "4px 8px", borderRadius: 12, border: "1px solid rgba(249,115,22,0.2)" }}>{doc.category}</span>
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
            <div className="max-w-4xl mx-auto pb-28">
              <div className="mb-6">
                <span className="text-[11px] font-bold tracking-widest text-[#f97316] uppercase">OFFICIAL ANNOUNCEMENTS</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Campus Notices</h2>
                <p className="text-sm text-zinc-400 mt-1">University bulletins, academic calendars, and parent updates.</p>
              </div>

              <div className="flex flex-col gap-4">
                {notices.map(notice => (
                  <article key={notice.id} className="glass-panel p-5 sm:p-6 rounded-3xl border-l-4 border-l-[#f97316] border border-white/10 bg-black/30 backdrop-blur-md shadow-xl flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {notice.category && (
                        <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30">
                          {notice.category}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 font-medium ml-auto">
                        {new Date(notice.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug break-words">
                      {notice.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                      {notice.body || notice.summary}
                    </p>
                  </article>
                ))}

                {notices.length === 0 && (
                  <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center bg-black/20">
                    <Bell className="mx-auto text-zinc-500 mb-3" size={36} />
                    <p className="text-white font-bold text-base">No Campus Notices</p>
                    <p className="text-zinc-400 text-xs mt-1">You are all caught up with official university updates.</p>
                  </div>
                )}
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
                    <button onClick={handleCreateTicket} disabled={creatingTicket || !ticketSubject || !ticketDesc} style={{ background: "#f97316", color: "#fff", border: "none", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, opacity: (creatingTicket || !ticketSubject || !ticketDesc) ? 0.5 : 1 }}>
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
                          background: ticket.status === 'open' ? "rgba(245, 158, 11, 0.1)" : ticket.status === 'resolved' ? "rgba(249, 115, 22, 0.1)" : "rgba(59, 130, 246, 0.1)",
                          color: ticket.status === 'open' ? "#f59e0b" : ticket.status === 'resolved' ? "#f97316" : "#3b82f6"
                        }}>{ticket.status}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#a1a1aa", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ticket.description}</p>
                      <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setActiveTicketChatId(ticket.id)}
                          style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(249, 115, 22, 0.15)", color: "#f97316", border: "1px solid rgba(249, 115, 22, 0.3)", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          <MessageSquare size={14} /> Live Chat
                        </button>
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && <p style={{ color: "#a1a1aa", fontSize: 14 }}>No tickets submitted.</p>}
                </div>
              </div>

            </div>
          </div>
        ) : tab === "Fee Statements" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 100 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>Fee Statements</h2>
                <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#f97316", color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  Upload Image/PDF
                  <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleUploadTimetable} disabled={uploading} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
                {timetables.map(t => (
                  <div key={t.id} className="glass-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Wallet color="#8b5cf6" size={24} />
                      <span style={{ fontWeight: 600, fontSize: 15, flex: 1, color: "#fff" }}>{t.title}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#8b5cf6", background: "rgba(139, 92, 246, 0.1)", padding: "4px 8px", borderRadius: 12, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}>
                      <ClockIcon size={12} /> {t.processing_status}
                    </span>
                  </div>
                ))}
                {timetables.length === 0 && (
                  <div className="glass-panel" style={{ padding: 40, gridColumn: "1 / -1", textAlign: "center" }}>
                    <Wallet size={48} color="#52525b" style={{ margin: "0 auto 16px" }} />
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
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #059669)", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 16, boxShadow: "0 8px 32px rgba(249,115,22,0.3)" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{name}</h3>
                <span style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 8 }}>{profile?.email}</span>
                <span style={{ fontSize: 12, color: "#f97316", background: "rgba(249, 115, 22, 0.1)", padding: "4px 12px", borderRadius: 100, fontWeight: 600, textTransform: "uppercase", border: "1px solid rgba(249,115,22,0.2)" }}>Parent Account</span>
                
                <hr style={{ width: "100%", border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "32px 0" }} />
                
                <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "12px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "center", marginBottom: 12 }}>
                  <LogOut size={18} /> Sign Out securely
                </button>
                <button onClick={handleDeleteAccount} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239, 68, 68, 0.18)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.35)", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "center" }}>
                  <UserX size={18} /> Delete Account Permanently
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
                  <button onClick={() => handleUpdateLanguage("en")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: language === "en" ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: 12, cursor: "pointer", transition: "0.2s" }}>
                    <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>English</span>
                    {language === "en" && <CheckCircle2 size={18} color="#f97316" />}
                  </button>
                  <button onClick={() => handleUpdateLanguage("sw")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", border: language === "sw" ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: 12, cursor: "pointer", transition: "0.2s" }}>
                    <span style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>Kiswahili</span>
                    {language === "sw" && <CheckCircle2 size={18} color="#f97316" />}
                  </button>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: 24, marginBottom: 24, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>Account & Security</h3>
                <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 20 }}>Sign out securely or permanently delete your parent portal account.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(245, 158, 11, 0.1)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "14px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "flex-start" }}>
                    <LogOut size={18} /> Sign Out Securely
                  </button>
                  <button onClick={handleDeleteAccount} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "14px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", justifyContent: "flex-start" }}>
                    <UserX size={18} /> Delete Account Permanently
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </section>

      <EscalateModal payload={escalatePayload} onClose={() => setEscalatePayload(null)} onOpenTicketChat={(ticketId) => setActiveTicketChatId(ticketId)} />
      <TicketChatModal ticketId={activeTicketChatId} userRole="parent" onClose={() => setActiveTicketChatId(null)} />
    </main>
  );
}

