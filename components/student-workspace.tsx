"use client";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, Bell, BookOpen, BookOpenCheck, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock, Clock as ClockIcon, Download, File as FileIcon, FileText, GraduationCap, HeadphonesIcon, Home, Image as ImageIcon, Landmark, Loader2, Lock, LogOut, Menu, MessageCircleMore, MessageSquare, Mic, PanelLeft, PanelLeftClose, Plus, Paperclip, Search, Send, Settings, ShieldCheck, Sparkles, Ticket, Trash2, UploadCloud, User, Volume2, VolumeX, Wallet, X, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";
import { InstallButton } from "./install-button";

type Tab = "Home" | "Chats" | "Documents" | "Notices" | "My timetable" | "Support" | "Profile" | "Settings";
const navigation: [Tab, any][] = [
  ["Home", Home],
  ["Chats", MessageCircleMore],
  ["Documents", FileText],
  ["Notices", Bell],
  ["My timetable", CalendarDays],
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

import { MarkdownRender as MarkdownMessage } from "./markdown-render";
import { EscalateModal } from "./escalate-modal";

export function StudentWorkspace() {
  const [tab, setTab] = useState<Tab>("Home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [name, setName] = useState("Student");
  const [showDocuments, setShowDocuments] = useState(false);
  const [query, setQuery] = useState("");
  const [showTools, setShowTools] = useState(false);
  const [attachment, setAttachment] = useState<{name: string, type: string, base64: string} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [scheduleWeekOffset, setScheduleWeekOffset] = useState(0);
  const [myCourses, setMyCourses] = useState<Record<string, string>>({});
  const [hiddenCourses, setHiddenCourses] = useState<Set<string>>(new Set());
  const [timetableMetadata, setTimetableMetadata] = useState<Record<string, { groups: string[], courses: string[], mapped?: Record<string, string[]> }>>({});
  const [selectedGroup, setSelectedGroup] = useState<Record<string, string>>({});
  const [selectedCourses, setSelectedCourses] = useState<Record<string, string[]>>({});
  const [courseSearchFilters, setCourseSearchFilters] = useState<Record<string, string>>({});
  const [extractingMetadataId, setExtractingMetadataId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [language, setLanguage] = useState("en");
  const [docQuery, setDocQuery] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketDeptId, setTicketDeptId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [readingMsgId, setReadingMsgId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [semesterStart, setSemesterStart] = useState("");
  const [escalatePayload, setEscalatePayload] = useState<{subject: string, body: string} | null>(null);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setQuery((prev) => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };
  const [semesterEnd, setSemesterEnd] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [isLinked, setIsLinked] = useState(false);

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;
  const messages = activeConv?.messages ?? [];

  useEffect(() => {
    const storedReduceMotion = localStorage.getItem("reduceMotion") === "true";
    const storedAutoRead = localStorage.getItem("autoRead") === "true";
    const storedReminder = localStorage.getItem("reminderMinutes");
    setReduceMotion(storedReduceMotion);
    setAutoRead(storedAutoRead);
    if (storedReminder) setReminderMinutes(parseInt(storedReminder, 10));

    if (!supabase) return;
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("documents").select("id,title,category,file_type,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(20),
      supabase.from("notices").select("*").order("published_at", { ascending: false }).limit(20),
      supabase.from("tickets").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("personal_resources").select("*").eq("resource_type", "timetable").order("created_at", { ascending: false }),
      supabase.from("departments").select("id,name").order("name"),
      supabase.from("calendar_events").select("*").order("starts_at", { ascending: true })
    ]).then(async ([auth, docs, nots, tcks, times, depts, calEvents]) => {
      const user = auth.data.user;
      setProfile(user);
      setIsLinked(user?.identities?.some((id: any) => id.identity_data?.email?.endsWith('@students.dkut.ac.ke')) || false);
      setName(user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student");
      if (user && supabase) {
        const { data: prof } = await supabase.from("profiles").select("preferred_language,custom_instructions").eq("id", user.id).single();
        if (prof?.preferred_language) setLanguage(prof.preferred_language);
        if (prof?.custom_instructions) setCustomInstructions(prof.custom_instructions);
        
        const { data: settings } = await supabase.from("system_settings").select("value").eq("key", "show_documents_to_users").single();
        if (settings && settings.value === 'true') setShowDocuments(true);
      }
      setDocuments(docs.data ?? []);
      setNotices(nots.data ?? []);
      setTickets(tcks.data ?? []);
      setDepartments(depts.data ?? []);
      setTimetables(times.data ?? []);
      setCalendarEvents(calEvents.data ?? []);
      // Auto-jump to the first week that has classes (relative to today)
      const events = calEvents.data ?? [];
      if (events.length > 0) {
        const now = new Date();
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() - dayOfWeek + 1);
        thisMonday.setHours(0, 0, 0, 0);
        // Find first event and compute its week offset
        const firstEvent = new Date(events[0].starts_at);
        const diffDays = Math.floor((firstEvent.getTime() - thisMonday.getTime()) / (1000 * 60 * 60 * 24));
        const offset = Math.floor(diffDays / 7);
        setScheduleWeekOffset(offset);
      }
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

  const handleExtractMetadata = async (resourceId: string) => {
    if (!supabase) return;
    setExtractingMetadataId(resourceId);
    const { data, error } = await supabase.functions.invoke("analyze-timetable-metadata", { body: { resourceId } });
    setExtractingMetadataId(null);
    if (error || data?.error) {
      alert("Extraction failed: " + (error?.message || data?.error || "Unknown error"));
      return;
    }
    setTimetableMetadata(prev => ({ ...prev, [resourceId]: data }));
    setSelectedGroup(prev => ({ ...prev, [resourceId]: data.groups?.[0] || "" }));
    setSelectedCourses(prev => ({ ...prev, [resourceId]: [] }));
  };

  const handleAnalyzeTimetable = async (resourceId: string) => {
    if (!supabase || !semesterStart || !semesterEnd) {
      alert("Please enter semester start and end dates first.");
      return;
    }
    setAnalyzingId(resourceId);
    
    const meta = timetableMetadata[resourceId];
    let courses = myCourses[resourceId] || "";
    if (meta) {
      const group = selectedGroup[resourceId] || "";
      const coursesArr = selectedCourses[resourceId] || [];
      courses = `Class Group: ${group}. Courses: ${coursesArr.join(", ")}`;
    }

    const { data, error } = await supabase.functions.invoke("analyze-timetable", {
      body: { resourceId, semesterStart, semesterEnd, courses: courses.trim(), reminderMinutes }
    });
    setAnalyzingId(null);
    if (error || data?.error) {
      alert("AI Analysis failed: " + (error?.message || data?.error || "Unknown error"));
    } else {
      if (supabase) {
        const { data: calData } = await supabase.from("calendar_events").select("*").order("starts_at", { ascending: true });
        setCalendarEvents(calData ?? []);
      }
      setTimetables(ts => ts.map(t => t.id === resourceId ? { ...t, processing_status: "ready" } : t));
      alert(`AI successfully analyzed your timetable and added ${data.eventsCreated || 0} classes to your schedule! Scroll down to see your weekly schedule.`);
    }
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

  const handleToggleReduceMotion = () => {
    const val = !reduceMotion;
    setReduceMotion(val);
    localStorage.setItem("reduceMotion", String(val));
  };

  const handleToggleAutoRead = () => {
    const val = !autoRead;
    setAutoRead(val);
    localStorage.setItem("autoRead", String(val));
  };

  const handleSaveCustomInstructions = async () => {
    if (!supabase || !profile) return;
    await supabase.from("profiles").update({ custom_instructions: customInstructions }).eq("id", profile.id);
    alert("AI Personalization saved securely.");
  };

  const handleLinkUniversity = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { queryParams: { prompt: 'select_account' } } });
    if (error) alert("Failed to link account: " + error.message);
  };

  const handleClearChatHistory = async () => {
    if (!supabase || !profile) return;
    if (!confirm("Are you sure you want to permanently delete all your chats?")) return;
    await supabase.from("conversations").delete().eq("user_id", profile.id);
    setConversations([]);
    setActiveConvId(null);
    setTab("Home");
    alert("Chat history permanently deleted.");
  };

  const handleDeleteTimetables = async () => {
    if (!supabase || !profile) return;
    if (!confirm("Are you sure you want to permanently delete all your uploaded timetables and extracted events?")) return;
    await supabase.from("personal_resources").delete().eq("user_id", profile.id).eq("resource_type", "timetable");
    setTimetables([]);
    setCalendarEvents([]);
    alert("Timetables permanently deleted.");
  };

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js");
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setPushEnabled(!!sub));
      });
    }
  }, []);

  const handleTogglePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported by your browser.");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      setPushEnabled(false);
    } else {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification permission denied.");
        return;
      }
      try {
        const res = await supabase?.functions.invoke("get-vapid");
        if (!res?.data?.publicKey) throw new Error("Missing VAPID Key");
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: res.data.publicKey });
        await supabase?.functions.invoke("save-push-subscription", { body: { subscription: sub } });
        setPushEnabled(true);
      } catch (err: any) {
        alert("Failed to subscribe: " + err.message);
      }
    }
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
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: value + (attachment ? `\n\n[Attachment: ${attachment.name}]` : "") };
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg], title: c.title === "New chat" ? value.slice(0, 42) : c.title } : c));
    
    const finalQuery = language === "sw" ? "(Please answer in Swahili) " + value : value;
    let { data, error } = await supabase.functions.invoke("chat", { body: { question: finalQuery, conversationId: convId, attachment } });
    
    if (data?.escalate) {
       const tempId = Date.now().toString() + "-temp";
       setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, { id: tempId, role: "assistant", content: "Searching official government and university sources (kuccps.net, helb.co.ke, etc.)..." }] } : c));
       
       const fallbackRes = await supabase.functions.invoke("chat", { body: { question: finalQuery, conversationId: convId, attachment, forceWebSearch: true } });
       data = fallbackRes.data;
       error = fallbackRes.error;
       
       setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c));
    }
    setAsking(false);
    setAttachment(null);

    let astMsg: Message;
    if (error) {
      let realMsg = error.message;
      try { const b = await error.context?.json(); if (b?.error) realMsg = b.error; } catch { }
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: `I could not reach KiliGuide. Error: ${realMsg}` };
    } else {
      astMsg = { id: Date.now().toString() + 1, role: "assistant", content: data.answer, sources: data.sources };
    }
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, astMsg] } : c));
    
    // Auto-read logic
    if (autoRead && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(astMsg.content.replace(/[*_#]/g, ''));
      u.lang = language === "sw" ? "sw-KE" : "en-KE";
      speechSynthesis.speak(u);
      setReadingMsgId(astMsg.id);
      u.onend = () => setReadingMsgId(null);
    }
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "rgba(11, 15, 20, 0.95)", backdropFilter: "blur(20px)" }}>
      {/* 1. Header & Brand */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", display: "grid", placeItems: "center", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
            </span>
            <div>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>KiliGuide</span>
              <span style={{ display: "block", fontSize: 10, color: "#a1a1aa", marginTop: 1 }}>DeKUT Campus AI</span>
            </div>
          </div>
          {mobileSidebar && (
            <button onClick={() => setMobileSidebar(false)} style={{ padding: 6, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "#a1a1aa", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* ChatGPT "+ New Chat" Button */}
        <motion.button 
          whileHover={{ scale: 1.01 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => { setActiveConvId(null); setTab("Chats"); setMobileSidebar(false); }} 
          style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 8, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, background: "linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.08) 100%)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> <span>New Chat</span>
          </div>
          <span style={{ fontSize: 10, opacity: 0.6, background: "rgba(16,185,129,0.2)", padding: "2px 6px", borderRadius: 4 }}>Ctrl+K</span>
        </motion.button>
      </div>

      {/* 2. Main Scrollable Container */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
        
        {/* Navigation / Workspace Tools */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#71717a", letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 8px 8px" }}>
            Navigation
          </div>
          {navigation.filter(([lbl]) => lbl !== "Documents" || showDocuments).map(([label, Icon]) => {
            const isActive = tab === label && !(label === "Chats" && !activeConvId);
            return (
              <button 
                key={label} 
                onClick={() => switchTab(label)}
                style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, borderRadius: 10, padding: "9px 10px", fontSize: 13, fontWeight: 500, background: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent", color: isActive ? "#10b981" : "#d4d4d8", border: isActive ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid transparent", cursor: "pointer", marginBottom: 2, transition: "background 0.15s" }}
              >
                <Icon size={16} style={{ color: isActive ? "#10b981" : "#a1a1aa", flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
              </button>
            );
          })}
          <InstallButton style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, borderRadius: 10, padding: "9px 10px", fontSize: 13, fontWeight: 500, color: "#a1a1aa", cursor: "pointer", marginBottom: 2 }} />
        </div>

        {/* ChatGPT-style Recent Conversations */}
        {conversations.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px 8px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#71717a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Recent Chats
              </span>
              <span style={{ fontSize: 10, color: "#52525b" }}>{conversations.length}</span>
            </div>
            
            {groups.today.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#52525b", padding: "2px 8px 6px" }}>Today</div>
                {groups.today.map(c => {
                  const isActive = activeConvId === c.id && tab === "Chats";
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => loadConv(c.id)} 
                      className="conv-item" 
                      style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "7px 10px", cursor: "pointer", background: isActive ? "rgba(255,255,255,0.08)" : "transparent", marginBottom: 2 }}
                    >
                      <MessageSquare size={14} style={{ color: isActive ? "#10b981" : "#71717a", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? "#fff" : "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                      <button onClick={(e) => deleteConv(c.id, e)} className="del-btn" style={{ opacity: 0, color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {(groups.yesterday.length > 0 || groups.week.length > 0 || groups.older.length > 0) && (
              <div>
                <div style={{ fontSize: 10, color: "#52525b", padding: "2px 8px 6px" }}>Previous</div>
                {[...groups.yesterday, ...groups.week, ...groups.older].map(c => {
                  const isActive = activeConvId === c.id && tab === "Chats";
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => loadConv(c.id)} 
                      className="conv-item" 
                      style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "7px 10px", cursor: "pointer", background: isActive ? "rgba(255,255,255,0.08)" : "transparent", marginBottom: 2 }}
                    >
                      <MessageSquare size={14} style={{ color: isActive ? "#10b981" : "#71717a", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? "#fff" : "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
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
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.3)" }}>
        <button onClick={() => switchTab("Profile")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: "4px", borderRadius: 8, textAlign: "left", minWidth: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 2px 8px rgba(16,185,129,0.2)" }}>
            {name.charAt(0).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{name}</span>
            <span style={{ display: "block", fontSize: 10, color: "#a1a1aa", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Student Plan</span>
          </div>
        </button>
        
        <button onClick={() => switchTab("Settings")} title="Settings" style={{ padding: 7, borderRadius: 8, background: tab === "Settings" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.05)", border: tab === "Settings" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255,255,255,0.08)", color: tab === "Settings" ? "#10b981" : "#a1a1aa", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Settings size={16} />
        </button>

        <button onClick={handleSignOut} title="Sign Out" style={{ padding: 7, borderRadius: 8, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <main className={`bg-aurora ${reduceMotion ? "reduce-motion" : ""}`} style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", color: "#ececec" }}>
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
          background: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
        }
      `}</style>

      <aside className="desktop-only glazed-sidebar" style={{ width: sidebarOpen ? 280 : 0, transition: "width 0.4s", flexShrink: 0, flexDirection: "column", overflow: "hidden", margin: sidebarOpen ? "24px 0 24px 24px" : "24px 0", height: "calc(100vh - 48px)" }}>
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
        
        <header className="desktop-only" style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 40px", gap: 16, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="glazed-widget" style={{ marginRight: "auto", padding: 12, borderRadius: 16, color: "#ececec", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          <motion.button onClick={()=>ask()} className="glazed-button" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600 }}>
            <Sparkles size={14} style={{ color: "#10b981" }} /> Ask KiliGuide
          </motion.button>
          <motion.button onClick={()=>switchTab("Notices")} className="glazed-button" style={{ padding: 12 }}><Bell size={18} /></motion.button>
          <motion.button onClick={()=>switchTab("Settings")} className="glazed-button" style={{ padding: 12 }}><Settings size={18} /></motion.button>
        </header>

        <header className="mobile-only h-14 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-20">
          <button onClick={() => setMobileSidebar(true)} className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors bg-transparent border-none cursor-pointer">
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200">
            <Sparkles size={13} className="text-[#10b981]" />
            <span>KiliGuide AI</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => { setActiveConvId(null); setTab("Chats"); }} className="p-2 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981]/25 transition-colors cursor-pointer" title="New Chat">
              <Plus size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        {tab === "Home" ? (
          <div style={{ flex: 1, overflowY: "auto", position: "relative" }} className="hide-scroll">
            
            {/* --- DESKTOP HOME (BENTO BOX DASHBOARD) --- */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="desktop-only" style={{ padding: "40px 32px 100px", maxWidth: 1000, margin: "0 auto" }}>
              
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                  Good morning, {name.split(" ")[0]} 👋
                </h1>
                <p style={{ color: "#a1a1aa", fontSize: 16 }}>Your campus, simplified.</p>
              </div>

              <div style={{ display: "grid", gap: 24 }}>
                
                {/* Ask KiliGuide Hero (Full Width) */}
                <div className="glazed-widget" style={{ padding: 40, border: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <Sparkles size={20} style={{ color: "#10b981" }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Ask KiliGuide</h2>
                  </div>
                  <p style={{ color: "#ececec", fontSize: 16, marginBottom: 24 }}>"What do you need help with?"</p>
                  
                  <motion.div 
                    className="glazed-input" 
                    animate={asking ? { boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 20px rgba(16, 185, 129, 0.4)", "0 0 0px rgba(16, 185, 129, 0)"] } : {}}
                    transition={asking ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px 12px 24px", maxWidth: 600 }}
                  >
                    <Search size={20} style={{ color: "#10b981" }} />
                    <input disabled={asking} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !asking) ask(); }} placeholder={asking ? "Processing..." : "Search university knowledge..."} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, color: "#fff", opacity: asking ? 0.7 : 1 }} />
                    <motion.button onClick={() => ask()} disabled={!query.trim() || asking} style={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", border: "none", background: query.trim() || asking ? "linear-gradient(135deg, rgba(25, 195, 125, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)" : "rgba(255,255,255,0.1)", color: "#fff", cursor: query.trim() && !asking ? "pointer" : "not-allowed", transition: "0.2s", boxShadow: query.trim() || asking ? "0 4px 20px rgba(25, 195, 125, 0.3)" : "none" }}>
                      {asking ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "grid", placeItems: "center" }}>
                          <Loader2 size={16} />
                        </motion.div>
                      ) : (
                        <Send size={16} style={{ transform: "rotate(45deg)", marginLeft: -2 }} />
                      )}
                    </motion.button>
                  </motion.div>
                </div>

                {/* Split Widgets: Upcoming & Campus */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {/* Upcoming Widget */}
                  <div className="glazed-widget" style={{ padding: 32, border: "none", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                      <CalendarDays size={20} style={{ color: "#8b5cf6" }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.05em", textTransform: "uppercase" }}>Upcoming</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                      {timetables.length > 0 ? (
                        <>
                          <h4 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Next Class/Exam</h4>
                          <p style={{ color: "#d4d4d8", fontSize: 15 }}>Active and monitored.</p>
                        </>
                      ) : (
                        <>
                          <h4 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Timetable Integration</h4>
                          <p style={{ color: "#d4d4d8", fontSize: 15 }}>No timetable uploaded yet.</p>
                        </>
                      )}
                    </div>
                    <button onClick={() => switchTab("My timetable")} style={{ alignSelf: "flex-start", marginTop: 24, background: "transparent", border: "none", color: "#8b5cf6", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      View calendar <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Campus Widget */}
                  <div className="glazed-widget" style={{ padding: 32, border: "none", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                      <Bell size={20} style={{ color: "#fbbf24" }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.05em", textTransform: "uppercase" }}>Campus</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Latest Notice</h4>
                      {notices.length > 0 ? (
                        <p style={{ color: "#d4d4d8", fontSize: 15, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{notices[0].title}</p>
                      ) : (
                        <p style={{ color: "#a1a1aa", fontSize: 15 }}>No new notices.</p>
                      )}
                    </div>
                    <button onClick={() => switchTab("Notices")} style={{ alignSelf: "flex-start", marginTop: 24, background: "transparent", border: "none", color: "#fbbf24", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      View all <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Quick Access Bento Grid */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#a1a1aa", marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase" }}>Quick Access</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
                    {/* Row 1: Large Cards (Span 3) */}
                    <motion.div whileHover={{ y: -4 }} onClick={() => ask("What are the academic rules and unit registration processes?")} className="glazed-widget" style={{ gridColumn: "span 3", padding: 24, cursor: "pointer", border: "none", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(16, 185, 129, 0.15)", display: "grid", placeItems: "center" }}>
                        <GraduationCap size={22} style={{ color: "#10b981" }} />
                      </div>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", display: "block", marginBottom: 4 }}>Academics</span>
                        <span style={{ fontSize: 14, color: "#a1a1aa" }}>Registration & Units →</span>
                      </div>
                    </motion.div>
                    
                    <motion.div whileHover={{ y: -4 }} onClick={() => ask("How do I clear my fee balance?")} className="glazed-widget" style={{ gridColumn: "span 3", padding: 24, cursor: "pointer", border: "none", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(56, 189, 248, 0.15)", display: "grid", placeItems: "center" }}>
                        <Wallet size={22} style={{ color: "#38bdf8" }} />
                      </div>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", display: "block", marginBottom: 4 }}>Fees</span>
                        <span style={{ fontSize: 14, color: "#a1a1aa" }}>Fee statement →</span>
                      </div>
                    </motion.div>

                    {/* Row 2: Smaller Cards (Span 2) */}
                    <motion.div whileHover={{ y: -4 }} onClick={() => ask("Are there internal hostels available?")} className="glazed-widget" style={{ gridColumn: "span 2", padding: 20, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <Home size={18} style={{ color: "#f43f5e" }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Accommodation</span>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} onClick={() => ask("What do I do about missing marks?")} className="glazed-widget" style={{ gridColumn: "span 2", padding: 20, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <BookOpenCheck size={18} style={{ color: "#a855f7" }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Exams</span>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} onClick={() => ask("How do I connect to student WiFi?")} className="glazed-widget" style={{ gridColumn: "span 2", padding: 20, cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <HeadphonesIcon size={18} style={{ color: "#fb923c" }} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Support</span>
                    </motion.div>
                  </div>
                </div>

                {/* Recently Used */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#a1a1aa", marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase" }}>Recently Used</h3>
                  <div className="glazed-widget" style={{ padding: "8px 0", border: "none" }}>
                    {conversations.slice(0, 3).map((c, idx) => (
                      <div key={c.id} onClick={() => loadConv(c.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", cursor: "pointer", borderBottom: idx < Math.min(conversations.length - 1, 2) ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <FileText size={18} style={{ color: "#10b981" }} />
                        <span style={{ flex: 1, fontSize: 15, color: "#ececec", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{formatRelTime(c.createdAt)}</span>
                      </div>
                    ))}
                    {conversations.length === 0 && <p style={{ color: "#a1a1aa", fontSize: 14, padding: "16px 24px" }}>No recent activity.</p>}
                  </div>
                </div>

              </div>
            </motion.div>


            {/* --- CLEAN CHATGPT-STYLE MOBILE HOME --- */}
            <div className="mobile-only p-4 pb-28 min-h-full flex flex-col gap-6">
              
              {/* Greeting & Search */}
              <div className="pt-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
                  How can I help you today? 👋
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mb-4">Official DeKUT campus guide powered by AI.</p>

                {/* ChatGPT-style Search Bar */}
                <div className="flex items-center gap-3 rounded-full px-4 py-2.5 border border-[#10b981]/50 bg-black/40 shadow-lg backdrop-blur-md">
                  <Search size={18} className="text-[#10b981] flex-shrink-0" />
                  <input 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    onKeyDown={e => { if (e.key === "Enter") ask(); }} 
                    placeholder="Ask fees, units, timetables, hostels..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-zinc-500" 
                  />
                  <button onClick={() => ask()} disabled={!query.trim()} className="w-8 h-8 rounded-full grid place-items-center bg-[#10b981] text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0 border-none cursor-pointer">
                    <Send size={14} className="ml-0.5 -rotate-45" />
                  </button>
                </div>
              </div>

              {/* Quick Access (2x2 Grid) */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Quick Access</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div onClick={() => ask("How do I register for units?")} className="glass-panel p-3.5 rounded-2xl cursor-pointer flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 grid place-items-center flex-shrink-0">
                      <GraduationCap size={18} className="text-[#10b981]" />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">Academics</span>
                  </div>

                  <div onClick={() => ask("How do I clear my fee balance?")} className="glass-panel p-3.5 rounded-2xl cursor-pointer flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 grid place-items-center flex-shrink-0">
                      <Wallet size={18} className="text-sky-400" />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">Fees</span>
                  </div>

                  <div onClick={() => switchTab("My timetable")} className="glass-panel p-3.5 rounded-2xl cursor-pointer flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 grid place-items-center flex-shrink-0">
                      <CalendarDays size={18} className="text-purple-400" />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">Timetable</span>
                  </div>

                  <div onClick={() => switchTab("Support")} className="glass-panel p-3.5 rounded-2xl cursor-pointer flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 grid place-items-center flex-shrink-0">
                      <HeadphonesIcon size={18} className="text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">Support</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {conversations.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Activity</h3>
                    <button onClick={() => setTab("Chats")} className="text-xs font-semibold text-[#10b981] bg-transparent border-none cursor-pointer">View All</button>
                  </div>
                  <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-white/5">
                    {conversations.slice(0, 3).map((c) => (
                      <div key={c.id} onClick={() => loadConv(c.id)} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors">
                        <Clock size={15} className="text-[#10b981] flex-shrink-0" />
                        <span className="flex-1 text-xs text-zinc-200 truncate">{c.title}</span>
                        <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : tab === "Chats" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative", paddingBottom: 80 }}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              <div className="max-w-3xl mx-auto px-3.5 sm:px-5 pt-4 sm:pt-6 pb-28 w-full">
                {messages.map((m) => (
                  <div key={m.id} className="mb-5 sm:mb-6">
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="glass-panel max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-xs px-4 py-2.5 sm:px-5 sm:py-3 text-sm text-white bg-[#10b981]/15 border border-[#10b981]/30">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5 sm:gap-3.5 items-start">
                        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden grid place-items-center flex-shrink-0 mt-0.5 bg-white/5 border border-white/10 shadow-sm">
                          <img src="/logo.png" alt="KiliGuide" className="w-full h-full object-cover transform scale-125 translateY-0.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm text-zinc-100 leading-normal">
                            <MarkdownMessage content={m.content} />
                          </div>
                          
                          {m.sources && m.sources.length > 0 && (
                            <details className="mt-2.5">
                              <summary className="text-xs text-zinc-400 cursor-pointer inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full outline-none user-select-none border border-white/5 transition-colors">
                                <ShieldCheck size={13} className="text-[#10b981]" /> Sources
                              </summary>
                              <div className="flex flex-wrap gap-1.5 mt-2 pl-2">
                                {Array.from(new Map(m.sources.map((s: any) => [`${s.title}-${s.page}`, s])).values()).map((s: any, idx) => (
                                  <span key={idx} className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-md px-2.5 py-1 text-[11px] text-[#10b981] flex items-center gap-1.5">
                                    <FileText size={11} /> {s.title} {s.page ? `(Pg. ${s.page})` : ""}
                                  </span>
                                ))}
                              </div>
                            </details>
                          )}

                          <div className="flex items-center gap-2.5 mt-2.5">
                            <button onClick={() => toggleReadAloud(m.id, m.content)} title={readingMsgId === m.id ? "Stop reading" : "Read aloud"} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 cursor-pointer transition-colors ${readingMsgId === m.id ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-white/5 text-zinc-400 hover:text-white"}`}>
                              {readingMsgId === m.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            <button onClick={() => escalateToHuman(m.content)} className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1 text-rose-400 text-xs cursor-pointer hover:bg-rose-500/20 transition-colors">
                              <HeadphonesIcon size={13} /> Escalate to Human
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {asking && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ display: "flex", gap: 16 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 12, overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, background: "rgba(255,255,255,0.05)" }}>
                      <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
                    </span>
                    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, padding: "12px 16px", borderRadius: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                          <Sparkles size={16} style={{ color: "#10b981" }} />
                        </motion.div>
                        <motion.span 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          style={{ fontSize: 14, color: "#ececec", fontWeight: 500, letterSpacing: "0.01em" }}
                        >
                          Analyzing DeKUT knowledge base...
                        </motion.span>
                      </div>
                      <motion.span 
                        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.8, duration: 1 }}
                        style={{ fontSize: 12, color: "#a1a1aa", marginLeft: 28 }}
                      >
                        Fetching official documents and synthesizing response
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, padding: "0 12px", background: "transparent", zIndex: 30 }}>
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <motion.div 
                  className="glass-panel" 
                  animate={asking ? { boxShadow: ["0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0px rgba(16, 185, 129, 0)", "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 15px rgba(16, 185, 129, 0.3)", "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0px rgba(16, 185, 129, 0)"] } : {}}
                  transition={asking ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
                  style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 24, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(18, 24, 32, 0.95)", backdropFilter: "blur(16px)", position: "relative" }}
                >
                  <AnimatePresence>
                    {showTools && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 12, background: "rgba(16, 185, 129, 0.1)", backdropFilter: "blur(24px)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 16, padding: 8, zIndex: 50, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
                      >
                        <button 
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowTools(false);
                          }}
                          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", background: "transparent", border: "none", color: "#ececec", borderRadius: 8, cursor: "pointer", fontSize: 14, textAlign: "left", transition: "background 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <FileIcon size={18} style={{ color: "#10b981" }} />
                          Upload Attachment
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: "none" }} 
                    accept=".pdf,.png,.jpg,.jpeg,.webp" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = (event.target?.result as string).split(',')[1];
                        setAttachment({ name: file.name, type: file.type, base64 });
                      };
                      reader.readAsDataURL(file);
                    }} 
                  />
                  
                  {attachment && (
                    <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, color: "#ececec", fontSize: 13 }}>
                      <FileIcon size={14} style={{ color: "#10b981" }} />
                      <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.name}</span>
                      <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", display: "flex" }}><X size={14} /></button>
                    </div>
                  )}
                  
                  <button onClick={() => setShowTools(!showTools)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: showTools ? "#10b981" : "#ececec", transition: "0.2s", flexShrink: 0 }}>
                    <Paperclip size={18} />
                  </button>

                  <textarea disabled={asking} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !asking) { e.preventDefault(); ask(); } }} placeholder={asking ? "Processing..." : isListening ? "Listening..." : "Ask anything about DeKUT…"} rows={1} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 14, lineHeight: "1.4", color: "#fff", padding: "6px 0", minHeight: 24, maxHeight: 160, opacity: asking ? 0.7 : 1, overflowY: "auto" }} />
                  <button onClick={toggleListening} style={{ background: "none", border: "none", color: isListening ? "#19c37d" : "#a1a1aa", cursor: "pointer", padding: 4, transition: "color 0.2s", flexShrink: 0 }}>
                    {isListening ? (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Mic size={20} style={{ color: "#19c37d" }} />
                      </motion.div>
                    ) : (
                      <Mic size={20} />
                    )}
                  </button>
                  <motion.button onClick={() => ask()} disabled={!query.trim() || asking} style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: query.trim() || asking ? "linear-gradient(180deg, rgba(25, 195, 125, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }}>
                    {asking ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "grid", placeItems: "center" }}>
                        <Loader2 size={16} color="#fff" />
                      </motion.div>
                    ) : (
                      <Send size={16} color={query.trim() ? "#fff" : "#a1a1aa"} />
                    )}
                  </motion.button>
                </motion.div>
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
                        <span style={{ fontSize: 11, color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.2)" }}>{doc.category}</span>
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
                  <div key={notice.id} className="glass-panel" style={{ padding: 24, borderLeft: "4px solid #10b981" }}>
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
                    <button onClick={handleCreateTicket} disabled={creatingTicket || !ticketSubject || !ticketDesc} style={{ background: "#10b981", color: "#fff", border: "none", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, opacity: (creatingTicket || !ticketSubject || !ticketDesc) ? 0.5 : 1 }}>
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
                          background: ticket.status === 'open' ? "rgba(245, 158, 11, 0.1)" : ticket.status === 'resolved' ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                          color: ticket.status === 'open' ? "#f59e0b" : ticket.status === 'resolved' ? "#10b981" : "#3b82f6"
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
        ) : tab === "My timetable" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div className="glazed-widget" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 48px", border: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>My Timetable</h2>
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#a1a1aa" }}>
                      Semester Start
                      <input type="date" value={semesterStart} onChange={e => setSemesterStart(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 13 }} />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#a1a1aa" }}>
                      Semester End
                      <input type="date" value={semesterEnd} onChange={e => setSemesterEnd(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 13 }} />
                    </label>
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
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
                  {t.processing_status !== "ready" && (
                      <>
                        {!timetableMetadata[t.id] ? (
                          <>
                            <p style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>First, extract the available classes and courses from the timetable.</p>
                            <button onClick={() => handleExtractMetadata(t.id)} disabled={extractingMetadataId === t.id} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: extractingMetadataId === t.id ? "not-allowed" : "pointer", opacity: extractingMetadataId === t.id ? 0.5 : 1, width: "100%", marginTop: 12 }}>
                              {extractingMetadataId === t.id ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                              {extractingMetadataId === t.id ? "Scanning Timetable..." : "Scan Timetable"}
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                              <div>
                                <label style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600, marginBottom: 4, display: "block" }}>1. Select Class/Semester</label>
                                <select value={selectedGroup[t.id] || ""} onChange={e => setSelectedGroup(prev => ({ ...prev, [t.id]: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", width: "100%" }}>
                                  <option value="">Select a group...</option>
                                  {timetableMetadata[t.id].groups.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </div>
                              
                                <div>
                                  <label style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600, marginBottom: 4, display: "block" }}>2. Select Your Courses</label>
                                  <input type="text" placeholder="Filter courses by name..." value={courseSearchFilters[t.id] || ""} onChange={e => setCourseSearchFilters(prev => ({...prev, [t.id]: e.target.value}))} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", width: "100%", marginBottom: 8 }} />
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto", background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }} className="hide-scroll">
                                    {timetableMetadata[t.id].courses
                                      .filter(c => {
                                        const group = selectedGroup[t.id];
                                        const mappedGroup = group ? timetableMetadata[t.id].mapped?.[group] : undefined;
                                        if (mappedGroup && !mappedGroup.includes(c)) return false;
                                        const query = courseSearchFilters[t.id]?.toLowerCase();
                                        if (query && !c.toLowerCase().includes(query)) return false;
                                        return true;
                                      })
                                      .map(c => (
                                      <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ececec", cursor: "pointer" }}>
                                        <input type="checkbox" checked={selectedCourses[t.id]?.includes(c) || false} onChange={(e) => {
                                          const checked = e.target.checked;
                                          setSelectedCourses(prev => {
                                            const curr = prev[t.id] || [];
                                            return { ...prev, [t.id]: checked ? [...curr, c] : curr.filter(x => x !== c) };
                                          });
                                        }} style={{ accentColor: "#8b5cf6", width: 16, height: 16 }} />
                                        {c}
                                      </label>
                                    ))}
                                    {timetableMetadata[t.id].courses.length === 0 && <span style={{fontSize:12, color:"#a1a1aa"}}>No courses extracted.</span>}
                                  </div>
                                </div>
                            </div>

                            <button onClick={() => handleAnalyzeTimetable(t.id)} disabled={analyzingId === t.id || !selectedGroup[t.id] || (selectedCourses[t.id] || []).length === 0} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (analyzingId === t.id || !selectedGroup[t.id] || (selectedCourses[t.id] || []).length === 0) ? "not-allowed" : "pointer", opacity: (analyzingId === t.id || !selectedGroup[t.id] || (selectedCourses[t.id] || []).length === 0) ? 0.5 : 1, width: "100%", marginTop: 16 }}>
                              {analyzingId === t.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                              {analyzingId === t.id ? "Generating Schedule..." : "Generate Schedule"}
                            </button>
                          </>
                        )}
                      </>
                    )}
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

              {/* ── WEEK SCHEDULE VIEW ── */}
              {calendarEvents.length > 0 && (() => {
                const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                // Unique courses for filter panel
                const allCourses = Array.from(new Set(calendarEvents.map(ev => ev.title)));
                const visibleEvents = calendarEvents.filter(ev => !hiddenCourses.has(ev.title));
                const now = new Date();
                const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
                const monday = new Date(now);
                monday.setDate(now.getDate() - dayOfWeek + 1 + scheduleWeekOffset * 7);
                monday.setHours(0, 0, 0, 0);
                const weekDays = DAYS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
                const weekStart = weekDays[0];
                const weekEnd = new Date(weekDays[weekDays.length - 1]); weekEnd.setHours(23, 59, 59);

                const eventsThisWeek = visibleEvents.filter(ev => {
                  const s = new Date(ev.starts_at);
                  const sDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());
                  const startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
                  const endDate = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
                  return sDate >= startDate && sDate <= endDate;
                });

                const eventsByDay: Record<number, any[]> = {};
                eventsThisWeek.forEach(ev => {
                  const d = new Date(ev.starts_at).getDay();
                  const idx = d === 0 ? 6 : d - 1; // 0=Mon…5=Sat
                  if (!eventsByDay[idx]) eventsByDay[idx] = [];
                  eventsByDay[idx].push(ev);
                });
                Object.values(eventsByDay).forEach(arr => arr.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()));

                const fmt = (d: Date) => d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
                const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
                const todayIdx = (() => { const d = now.getDay(); return d === 0 ? 6 : d - 1; })();
                const isCurrentWeek = scheduleWeekOffset === 0;

                const COLORS = [
                  { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#10b981" },
                  { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)", text: "#8b5cf6" },
                  { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", text: "#3b82f6" },
                  { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
                  { bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.3)", text: "#ec4899" },
                  { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.3)", text: "#06b6d4" },
                ];
                const courseColorMap: Record<string, number> = {};
                let colorIdx = 0;
                calendarEvents.forEach(ev => {
                  const key = ev.title.split(" ").slice(0, 3).join(" ");
                  if (!(key in courseColorMap)) courseColorMap[key] = colorIdx++ % COLORS.length;
                });

                return (
                  <div style={{ marginTop: 40 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Weekly Schedule</h3>
                        <p style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>
                          {fmt(weekStart)} – {fmt(weekEnd)} &nbsp;·&nbsp; {eventsThisWeek.length} class{eventsThisWeek.length !== 1 ? "es" : ""} this week
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setScheduleWeekOffset(o => o - 1)} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Prev</button>
                        {scheduleWeekOffset !== 0 && <button onClick={() => setScheduleWeekOffset(0)} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Today</button>}
                        <button onClick={() => setScheduleWeekOffset(o => o + 1)} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Next →</button>
                      </div>
                    </div>

                    {/* Course filter pills */}
                    {allCourses.length > 1 && (
                      <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 12, color: "#71717a", marginBottom: 10, fontWeight: 600 }}>FILTER UNITS — click to show/hide</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {allCourses.map(course => {
                            const key = course.split(" ").slice(0, 3).join(" ");
                            const c = COLORS[courseColorMap[key] ?? 0];
                            const hidden = hiddenCourses.has(course);
                            return (
                              <button
                                key={course}
                                onClick={() => setHiddenCourses(prev => {
                                  const next = new Set(prev);
                                  if (next.has(course)) next.delete(course); else next.add(course);
                                  return next;
                                })}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: 100,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  border: `1px solid ${hidden ? "rgba(255,255,255,0.1)" : c.border}`,
                                  background: hidden ? "rgba(255,255,255,0.03)" : c.bg,
                                  color: hidden ? "#52525b" : c.text,
                                  textDecoration: hidden ? "line-through" : "none",
                                  transition: "all 0.15s"
                                }}
                              >
                                {course}
                              </button>
                            );
                          })}
                          {hiddenCourses.size > 0 && (
                            <button onClick={() => setHiddenCourses(new Set())} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                              Show all
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Responsive Timetable Grid CSS */}
                    <style>{`
                      .timetable-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
                      @media (max-width: 1024px) {
                        .timetable-grid { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 16px; margin-left: -24px; margin-right: -24px; padding-left: 24px; padding-right: 24px; -webkit-overflow-scrolling: touch; }
                        .timetable-grid::-webkit-scrollbar { display: none; }
                        .timetable-grid > div { flex: 0 0 280px; scroll-snap-align: center; }
                      }
                    `}</style>

                    {/* Day columns */}
                    <div className="timetable-grid">
                      {DAYS.map((day, i) => {
                        const isToday = isCurrentWeek && i === todayIdx;
                        const dayEvents = eventsByDay[i] ?? [];
                        return (
                          <div key={day}>
                            {/* Day header */}
                            <div style={{
                              textAlign: "center", padding: "10px 4px", borderRadius: 10, marginBottom: 8,
                              background: isToday ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)",
                              border: isToday ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.05)"
                            }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#10b981" : "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{day}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? "#10b981" : "#fff", marginTop: 2 }}>{weekDays[i].getDate()}</div>
                            </div>

                            {/* Events */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {dayEvents.length === 0 ? (
                                <div style={{ padding: "10px 6px", borderRadius: 8, textAlign: "center" }}>
                                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontStyle: "italic" }}>Free</span>
                                </div>
                              ) : dayEvents.map((ev, ei) => {
                                const key = ev.title.split(" ").slice(0, 3).join(" ");
                                const c = COLORS[courseColorMap[key] ?? 0];
                                const startStr = fmtTime(ev.starts_at);
                                const endStr = ev.ends_at ? fmtTime(ev.ends_at) : null;
                                return (
                                  <div key={ev.id ?? ei} style={{
                                    padding: "12px 10px",
                                    borderRadius: 12,
                                    background: c.bg,
                                    border: `1px solid ${c.border}`,
                                    cursor: "default",
                                    transition: "transform 0.15s, box-shadow 0.15s",
                                    position: "relative",
                                    paddingRight: 32
                                  }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${c.border}`; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                                  >
                                    <button 
                                      onClick={() => alert(`Alarm set successfully! You will be notified before ${ev.title} begins at ${startStr}.`)}
                                      style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`, borderRadius: "50%", width: 24, height: 24, display: "grid", placeItems: "center", cursor: "pointer", color: c.text, opacity: 0.7, transition: "all 0.2s" }}
                                      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = c.border; }}
                                      onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                      title="Set Alarm"
                                    >
                                      <Settings size={12} />
                                    </button>
                                    {/* Accent bar */}
                                    <div style={{ width: 3, height: "100%", background: c.text, borderRadius: 2, float: "left", marginRight: 8, minHeight: 40 }} />
                                    <div style={{ overflow: "hidden" }}>
                                      {/* Course name */}
                                      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, lineHeight: 1.35, marginBottom: 5 }}>
                                        {ev.title}
                                      </div>
                                      {/* Time range */}
                                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", display: "flex", alignItems: "center", gap: 3, marginBottom: ev.location ? 3 : 0 }}>
                                        <span>🕐</span>
                                        <span>{startStr}{endStr ? ` – ${endStr}` : ""}</span>
                                      </div>
                                      {/* Location */}
                                      {ev.location && (
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          <span>📍</span>
                                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.location}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* No events this week */}
                    {eventsThisWeek.length === 0 && (
                      <div style={{ textAlign: "center", padding: "48px 0", color: "#52525b" }}>
                        <CalendarDays size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                        <p style={{ fontSize: 14 }}>No classes scheduled for this week.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>
        ) : tab === "Profile" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative" }}>
            <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 100 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                <button onClick={() => setTab("Home")} style={{ padding: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#ececec", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ArrowLeft size={18} />
                </button>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>My Profile</h2>
              </div>
              <div className="glass-panel" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 16, boxShadow: "0 8px 32px rgba(16,185,129,0.3)" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{name}</h3>
                <span style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 8 }}>{profile?.email}</span>
                <span style={{ fontSize: 12, color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "4px 12px", borderRadius: 100, fontWeight: 600, textTransform: "uppercase", border: "1px solid rgba(16,185,129,0.2)" }}>Student Account</span>
                
                <hr style={{ width: "100%", border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "32px 0" }} />
                
                <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "12px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "center" }}>
                  <LogOut size={18} /> Sign Out securely
                </button>
              </div>
            </div>
          </div>
        ) : tab === "Settings" ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
            <div className="max-w-xl mx-auto pb-24">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <button onClick={() => setTab("Home")} className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-200 cursor-pointer flex items-center justify-center hover:bg-white/10">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-white m-0">Settings</h2>
              </div>
              
              <div className="glass-panel p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm sm:text-base font-bold text-white m-0">Push Notifications</h3>
                  <button onClick={handleTogglePush} className={`w-11 h-6 rounded-full relative cursor-pointer border-none transition-colors ${pushEnabled ? "bg-[#10b981]" : "bg-white/20"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${pushEnabled ? "left-5.5" : "left-0.5"}`} />
                  </button>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm mb-4">Get real-time alerts for classes, resolved tickets, and notices.</p>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-white/5 pt-4 gap-2 sm:gap-4">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-white block">Class Reminder Alarm</span>
                    <span className="text-xs text-zinc-400">How many minutes before a class should we alert you?</span>
                  </div>
                  <select 
                    value={reminderMinutes} 
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setReminderMinutes(val);
                      localStorage.setItem("reminderMinutes", String(val));
                    }} 
                    className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm outline-none cursor-pointer"
                  >
                    <option value={10} className="bg-zinc-900">10 minutes</option>
                    <option value={15} className="bg-zinc-900">15 minutes</option>
                    <option value={30} className="bg-zinc-900">30 minutes</option>
                    <option value={60} className="bg-zinc-900">1 hour</option>
                  </select>
                </div>
              </div>
              
              <div className="glass-panel p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm sm:text-base font-bold text-white m-0">University Account Link</h3>
                  {isLinked ? (
                    <span className="bg-[#10b981]/15 text-[#10b981] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Linked
                    </span>
                  ) : null}
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm mb-4">Link your official @students.dkut.ac.ke email to securely access your live university grades and fee balances via KiliGuide AI.</p>
                {!isLinked && (
                  <button onClick={handleLinkUniversity} className="bg-white text-black border-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer flex items-center gap-2 hover:bg-zinc-100 transition-colors">
                    Link @students.dkut.ac.ke Email
                  </button>
                )}
              </div>

              <div className="glass-panel p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-bold text-white mb-2">AI Personalization</h3>
                <p className="text-zinc-400 text-xs sm:text-sm mb-3">Tell KiliGuide about your preferences. This helps the AI tailor its answers directly to you.</p>
                <textarea
                  value={customInstructions}
                  onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="e.g. I am a 3rd-year IT student. Always explain technical concepts simply without using complex jargon."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm resize-y outline-none mb-3 font-sans"
                />
                <button onClick={handleSaveCustomInstructions} className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer hover:bg-[#10b981]/25 transition-colors">
                  Save Personalization
                </button>
              </div>

              <div className="glass-panel p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-bold text-white mb-2">Appearance & Accessibility</h3>
                
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-white block">Reduce Motion</span>
                    <span className="text-xs text-zinc-400">Disable background animations and heavy blurs.</span>
                  </div>
                  <button onClick={handleToggleReduceMotion} className={`w-11 h-6 rounded-full relative cursor-pointer border-none transition-colors ${reduceMotion ? "bg-[#10b981]" : "bg-white/20"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${reduceMotion ? "left-5.5" : "left-0.5"}`} />
                  </button>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-white block">Auto-Read AI Answers</span>
                    <span className="text-xs text-zinc-400">Automatically speak out KiliGuide's responses.</span>
                  </div>
                  <button onClick={handleToggleAutoRead} className={`w-11 h-6 rounded-full relative cursor-pointer border-none transition-colors ${autoRead ? "bg-[#10b981]" : "bg-white/20"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${autoRead ? "left-5.5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
              
              <div className="glass-panel p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-bold text-white mb-2">Language & Localization</h3>
                <p className="text-zinc-400 text-xs sm:text-sm mb-4">Choose the preferred language for KiliGuide AI to communicate with you.</p>
                
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => handleUpdateLanguage("en")} className={`flex items-center justify-between bg-black/20 p-3.5 sm:p-4 rounded-xl cursor-pointer transition-colors ${language === "en" ? "border border-[#10b981]" : "border border-white/10"}`}>
                    <span className="text-xs sm:text-sm text-white font-semibold">English</span>
                    {language === "en" && <CheckCircle2 size={16} className="text-[#10b981]" />}
                  </button>
                  <button onClick={() => handleUpdateLanguage("sw")} className={`flex items-center justify-between bg-black/20 p-3.5 sm:p-4 rounded-xl cursor-pointer transition-colors ${language === "sw" ? "border border-[#10b981]" : "border border-white/10"}`}>
                    <span className="text-xs sm:text-sm text-white font-semibold">Kiswahili</span>
                    {language === "sw" && <CheckCircle2 size={16} className="text-[#10b981]" />}
                  </button>
                </div>
              </div>
              
              <div className="glass-panel p-4 sm:p-6 mb-4 sm:mb-6 border border-rose-500/20">
                <h3 className="text-sm sm:text-base font-bold text-rose-400 mb-2">Data & Privacy Controls</h3>
                <p className="text-zinc-400 text-xs sm:text-sm mb-4">Permanently delete your data. This action cannot be undone.</p>
                <div className="flex flex-col gap-2.5">
                  <button onClick={handleClearChatHistory} className="flex items-center gap-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer w-full justify-start hover:bg-rose-500/20 transition-colors">
                    <Trash2 size={16} /> Clear Chat History
                  </button>
                  <button onClick={handleDeleteTimetables} className="flex items-center gap-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer w-full justify-start hover:bg-rose-500/20 transition-colors">
                    <CalendarDays size={16} /> Delete Uploaded Timetables
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </section>

      <EscalateModal payload={escalatePayload} onClose={() => setEscalatePayload(null)} />
    </main>
  );
}
