"use client";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, Bell, BookOpen, BookOpenCheck, Building2, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Clock, Clock as ClockIcon, Download, File as FileIcon, FileText, GraduationCap, HeadphonesIcon, Home, Image as ImageIcon, Landmark, Loader2, Lock, LogOut, Menu, MessageCircleMore, MessageSquare, Mic, PanelLeft, PanelLeftClose, Plus, Paperclip, RotateCw, Search, Send, Settings, ShieldCheck, Sparkles, Ticket, Trash2, UploadCloud, User, Volume2, VolumeX, Wallet, X, Zap } from "lucide-react";
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
  const [mobileDayIdx, setMobileDayIdx] = useState<number | null>(null);
  const [myCourses, setMyCourses] = useState<Record<string, string>>({});
  const [hiddenCourses, setHiddenCourses] = useState<Set<string>>(new Set());
  const [timetableMetadata, setTimetableMetadata] = useState<Record<string, { groups: string[], courses: string[], mapped?: Record<string, string[]> }>>({});
  const [selectedGroup, setSelectedGroup] = useState<Record<string, string>>({});
  const [selectedCourses, setSelectedCourses] = useState<Record<string, string[]>>({});
  const [courseSearchFilters, setCourseSearchFilters] = useState<Record<string, string>>({});
  const [extractingMetadataId, setExtractingMetadataId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [institutionId, setInstitutionId] = useState<string>("00000000-0000-0000-0000-000000000001");
  const [institutionName, setInstitutionName] = useState<string>("Dedan Kimathi University of Technology");
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
  const [semesterEnd, setSemesterEnd] = useState("");
  const [escalatePayload, setEscalatePayload] = useState<{subject: string, body: string} | null>(null);
  const [activeTimetableIdx, setActiveTimetableIdx] = useState(0);

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
        const { data: prof } = await supabase.from("profiles").select("preferred_language,custom_instructions,institution_id,institutions(name)").eq("id", user.id).single();
        if (prof?.preferred_language) setLanguage(prof.preferred_language);
        if (prof?.custom_instructions) setCustomInstructions(prof.custom_instructions);
        if (prof?.institution_id) setInstitutionId(prof.institution_id);
        if ((prof as any)?.institutions?.name) setInstitutionName((prof as any).institutions.name);

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
      department_id: ticketDeptId || null,
      institution_id: institutionId || null
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
    let errorMsg = data?.error;
    if (!errorMsg && error) {
      errorMsg = error.message;
      try {
        const errJson = await (error as any).context?.json();
        if (errJson?.error) errorMsg = errJson.error;
      } catch (_) {}
    }
    if (errorMsg) {
      alert("Extraction failed: " + errorMsg);
      return;
    }
    setTimetableMetadata(prev => ({ ...prev, [resourceId]: data }));
    const firstGrp = data.groups?.[0] || "";
    const defaultCourses = firstGrp && data.mapped?.[firstGrp] ? data.mapped[firstGrp] : (data.courses || []);
    setSelectedGroup(prev => ({ ...prev, [resourceId]: firstGrp }));
    setSelectedCourses(prev => ({ ...prev, [resourceId]: defaultCourses }));
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
    let errorMsg = data?.error;
    if (!errorMsg && error) {
      errorMsg = error.message;
      try {
        const errJson = await (error as any).context?.json();
        if (errJson?.error) errorMsg = errJson.error;
      } catch (_) {}
    }
    if (errorMsg) {
      alert("AI Analysis failed: " + errorMsg);
    } else {
      if (supabase) {
        const { data: calData } = await supabase.from("calendar_events").select("*").order("starts_at", { ascending: true });
        setCalendarEvents(calData ?? []);
      }
      setTimetables(ts => ts.map(t => t.id === resourceId ? { ...t, processing_status: "ready" } : t));
      alert(`AI successfully analyzed your timetable and added ${data?.eventsCreated || 0} classes to your schedule! Scroll down to see your weekly schedule.`);
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.18) 0%, rgba(11, 15, 20, 0.96) 75%)", backdropFilter: "blur(24px)", borderRadius: 24, overflow: "hidden" }}>
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

      <aside className="desktop-only glazed-sidebar" style={{ width: sidebarOpen ? 280 : 0, transition: "width 0.4s", flexShrink: 0, flexDirection: "column", overflow: "hidden", margin: sidebarOpen ? "24px 0 24px 24px" : "24px 0", height: "calc(100vh - 48px)", borderRadius: 24 }}>
        <div style={{ width: 280, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", borderRadius: 24, overflow: "hidden" }}>
          <SidebarContent />
        </div>
      </aside>

      {mobileSidebar && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebar(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} style={{ position: "fixed", inset: "12px auto 12px 12px", width: 280, zIndex: 50, display: "flex", flexDirection: "column", height: "calc(100vh - 24px)", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 25px 60px rgba(0,0,0,0.8)" }}>
            <SidebarContent />
          </motion.aside>
        </AnimatePresence>
      )}

      <section style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", position: "relative", zIndex: 10 }}>
        
        <header className="desktop-only" style={{ margin: "20px 28px 0", padding: "12px 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(11, 15, 20, 0.75)", backdropFilter: "blur(24px)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", flexShrink: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} style={{ padding: 10, borderRadius: 12, color: "#a1a1aa", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "all 0.2s" }}>
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 600, color: "#d4d4d8" }}>
              <Sparkles size={14} style={{ color: "#10b981" }} />
              <span>{tab} Workspace</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", fontSize: 11, fontWeight: 600, color: "#10b981" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              DeKUT AI Online
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={()=>ask()} className="glazed-button" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 12, background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", cursor: "pointer" }}>
              <Sparkles size={14} /> <span>Ask KiliGuide</span>
            </motion.button>

            <button onClick={()=>switchTab("Notices")} title="Notices" style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa", cursor: "pointer", position: "relative" }}>
              <Bell size={18} />
              {notices.length > 0 && <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#fbbf24" }} />}
            </button>

            <button onClick={()=>switchTab("Settings")} title="Settings" style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa", cursor: "pointer" }}>
              <Settings size={18} />
            </button>
          </div>
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
            
            {/* --- DESKTOP HOME (ASYMMETRIC BENTO GRID DASHBOARD) --- */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="desktop-only" style={{ padding: "28px 28px 100px", maxWidth: 1360, margin: "0 auto" }}>
              
              {/* Top Welcome Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    Welcome back, {name.split(" ")[0]} 👋
                  </h1>
                  <p style={{ color: "#a1a1aa", fontSize: 14 }}>DeKUT Intelligent Campus Companion • Academic Year 2025/2026</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="glass-panel" style={{ padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={16} /> Portal Status: Verified Active
                  </div>
                </div>
              </div>

              {/* 3-Column Bento Grid Container */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
                
                {/* LEFT & CENTER COLUMN (Main Bento Workspace) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  
                  {/* Ask KiliGuide Hero AI Bar */}
                  <div className="glazed-widget" style={{ padding: 32, border: "none", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Sparkles size={20} style={{ color: "#10b981" }} />
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Ask KiliGuide AI Assistant</h2>
                      </div>
                      <span style={{ fontSize: 11, color: "#71717a", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 6 }}>RAG-indexed DeKUT Docs</span>
                    </div>
                    
                    <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 20 }}>Ask anything about unit registration, fee payment, exam timetables, or hostel booking.</p>
                    
                    <motion.div 
                      className="glazed-input" 
                      animate={asking ? { boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 20px rgba(16, 185, 129, 0.4)", "0 0 0px rgba(16, 185, 129, 0)"] } : {}}
                      transition={asking ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px 10px 20px" }}
                    >
                      <Search size={18} style={{ color: "#10b981" }} />
                      <input disabled={asking} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !asking) ask(); }} placeholder={asking ? "Searching DeKUT knowledge base..." : "Search university guidelines, fee statements, course units..."} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#fff", opacity: asking ? 0.7 : 1 }} />
                      <motion.button onClick={() => ask()} disabled={!query.trim() || asking} style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", border: "none", background: query.trim() || asking ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "rgba(255,255,255,0.08)", color: "#fff", cursor: query.trim() && !asking ? "pointer" : "not-allowed", transition: "0.2s" }}>
                        {asking ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "grid", placeItems: "center" }}>
                            <Loader2 size={16} />
                          </motion.div>
                        ) : (
                          <Send size={15} style={{ transform: "rotate(45deg)", marginLeft: -1 }} />
                        )}
                      </motion.button>
                    </motion.div>

                    {/* Quick Prompt Suggestion Pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                      {[
                        "Unit registration deadline?",
                        "Fee statement clearance steps",
                        "Hostel booking instructions",
                        "Missing exam marks escalation"
                      ].map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => ask(promptText)}
                          style={{ fontSize: 12, color: "#d4d4d8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", transition: "all 0.15s" }}
                          className="hover:border-[#10b981]/40 hover:text-white"
                        >
                          ✨ {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Interactive Bento Quick Access Cards */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "#71717a", marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Core Campus Portals</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                      
                      <motion.div whileHover={{ y: -3 }} onClick={() => ask("What are the academic rules and unit registration processes?")} className="glazed-widget" style={{ padding: 22, cursor: "pointer", border: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "grid", placeItems: "center" }}>
                            <GraduationCap size={20} style={{ color: "#10b981" }} />
                          </div>
                          <ChevronRight size={16} style={{ color: "#71717a" }} />
                        </div>
                        <div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", display: "block", marginBottom: 2 }}>Academics & Registration</span>
                          <span style={{ fontSize: 13, color: "#a1a1aa" }}>Unit registration guides & course outlines</span>
                        </div>
                      </motion.div>
                      
                      <motion.div whileHover={{ y: -3 }} onClick={() => ask("How do I clear my fee balance?")} className="glazed-widget" style={{ padding: 22, cursor: "pointer", border: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "grid", placeItems: "center" }}>
                            <Wallet size={20} style={{ color: "#38bdf8" }} />
                          </div>
                          <ChevronRight size={16} style={{ color: "#71717a" }} />
                        </div>
                        <div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", display: "block", marginBottom: 2 }}>Fees & Statements</span>
                          <span style={{ fontSize: 13, color: "#a1a1aa" }}>Fee breakdown, receipt verification & deadlines</span>
                        </div>
                      </motion.div>

                      <motion.div whileHover={{ y: -3 }} onClick={() => ask("Are there internal hostels available?")} className="glazed-widget" style={{ padding: 22, cursor: "pointer", border: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", display: "grid", placeItems: "center" }}>
                            <Home size={20} style={{ color: "#f43f5e" }} />
                          </div>
                          <ChevronRight size={16} style={{ color: "#71717a" }} />
                        </div>
                        <div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", display: "block", marginBottom: 2 }}>Hostels & Housing</span>
                          <span style={{ fontSize: 13, color: "#a1a1aa" }}>Internal rooms, private rentals & guidelines</span>
                        </div>
                      </motion.div>

                      <motion.div whileHover={{ y: -3 }} onClick={() => ask("How do I report missing marks?")} className="glazed-widget" style={{ padding: 22, cursor: "pointer", border: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", display: "grid", placeItems: "center" }}>
                            <BookOpenCheck size={20} style={{ color: "#a855f7" }} />
                          </div>
                          <ChevronRight size={16} style={{ color: "#71717a" }} />
                        </div>
                        <div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", display: "block", marginBottom: 2 }}>Exam Results & Audit</span>
                          <span style={{ fontSize: 13, color: "#a1a1aa" }}>Transcript status & missing marks resolution</span>
                        </div>
                      </motion.div>

                    </div>
                  </div>

                  {/* Recent Conversations List */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#71717a", letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent AI Discussions</h3>
                      <button onClick={() => switchTab("Chats")} style={{ background: "transparent", border: "none", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All ({conversations.length}) →</button>
                    </div>

                    <div className="glazed-widget" style={{ padding: "8px 0", border: "none" }}>
                      {conversations.slice(0, 4).map((c, idx) => (
                        <div key={c.id} onClick={() => loadConv(c.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", cursor: "pointer", borderBottom: idx < Math.min(conversations.length - 1, 3) ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <MessageSquare size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 14, color: "#ececec", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                          <span style={{ fontSize: 12, color: "#71717a" }}>{formatRelTime(c.createdAt)}</span>
                          <ChevronRight size={14} style={{ color: "#52525b" }} />
                        </div>
                      ))}
                      {conversations.length === 0 && <p style={{ color: "#71717a", fontSize: 13, padding: "16px 20px" }}>No recent conversations yet. Ask your first question above!</p>}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN (Campus Intelligence Side Panel) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  
                  {/* Live Campus Notices Board Widget */}
                  <div className="glazed-widget" style={{ padding: 22, border: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bell size={18} style={{ color: "#fbbf24" }} />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Official Campus Notices</h3>
                      </div>
                      <span style={{ fontSize: 10, background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>LIVE</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {notices.slice(0, 3).map((notice, nIdx) => (
                        <div key={nIdx} onClick={() => switchTab("Notices")} style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>{notice.title}</span>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ fontSize: 10, color: "#a1a1aa" }}>DeKUT Administration</span>
                            <span style={{ fontSize: 10, color: "#10b981", marginLeft: "auto" }}>Read notice →</span>
                          </div>
                        </div>
                      ))}
                      {notices.length === 0 && <p style={{ color: "#71717a", fontSize: 12 }}>No campus notices published.</p>}
                    </div>
                  </div>

                  {/* Upcoming Timetable & Lecture Schedule */}
                  <div className="glazed-widget" style={{ padding: 22, border: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <CalendarDays size={18} style={{ color: "#8b5cf6" }} />
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Schedule & Timetable</h3>
                    </div>

                    <div style={{ padding: "14px", borderRadius: 14, background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)", marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>Next Lecture</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", display: "block" }}>
                        {timetables.length > 0 ? "Active Monitored Session" : "No active timetable uploaded"}
                      </span>
                      <p style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>
                        {timetables.length > 0 ? "Check your personalized timetable tab for room allocations." : "Upload your semester PDF/ICS timetable to get smart alerts."}
                      </p>
                    </div>

                    <button onClick={() => switchTab("My timetable")} style={{ width: "100%", padding: "10px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Open Timetable Hub <ChevronRight size={15} />
                    </button>
                  </div>

                  {/* IT Support Ticket Status Card */}
                  <div className="glazed-widget" style={{ padding: 22, border: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <HeadphonesIcon size={18} style={{ color: "#10b981" }} />
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>DeKUT IT Helpdesk</h3>
                    </div>

                    <div style={{ padding: "12px", borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>SLA Response Guarantee</span>
                        <span style={{ fontSize: 10, color: "#fff", background: "rgba(16, 185, 129, 0.2)", padding: "2px 6px", borderRadius: 4 }}>24–48 hrs</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#a1a1aa" }}>Portal issues, Wi-Fi passwords, unit reg locks & fee clearance tickets.</p>
                    </div>

                    <button onClick={() => switchTab("Support")} style={{ width: "100%", padding: "10px", borderRadius: 12, background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Submit / Track Ticket <ChevronRight size={15} />
                    </button>
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative">
            <div className="max-w-4xl mx-auto pb-28">
              <div className="mb-6">
                <span className="text-[11px] font-bold tracking-widest text-[#10b981] uppercase">ANNOUNCEMENTS & UPDATES</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Campus Notices</h2>
                <p className="text-sm text-zinc-400 mt-1">Official bulletins, academic schedules, and administrative news.</p>
              </div>

              <div className="flex flex-col gap-4">
                {notices.map(notice => (
                  <article key={notice.id} className="glass-panel p-5 sm:p-6 rounded-3xl border-l-4 border-l-[#10b981] border border-white/10 bg-black/30 backdrop-blur-md shadow-xl flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {notice.category && (
                        <span className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
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
                    <p className="text-white font-bold text-base">No New Notices</p>
                    <p className="text-zinc-400 text-xs mt-1">You are all caught up with official university updates.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : tab === "Support" ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 relative">
            <div className="max-w-4xl mx-auto pb-28">
              
              {/* Purpose Banner */}
              <div className="glass-panel p-5 sm:p-8 rounded-3xl mb-8 border border-white/10 bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-purple-950/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/30 grid place-items-center text-[#10b981]">
                    <HeadphonesIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white m-0">DeKUT Official IT & Campus Helpdesk</h2>
                    <span className="text-xs text-[#10b981] font-semibold">Priority SLA: 24 – 48 Hours Response Guarantee</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 m-0 mt-3 leading-relaxed">
                  Submit official support tickets directly to DeKUT Directorate of ICT, Academic Registrar, and Student Affairs. Track ticket progress, receive real-time resolution alerts, or escalate unresolved issues.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Create Ticket Form */}
                <div className="lg:col-span-7">
                  <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-white/10">
                    <h3 className="text-base sm:text-lg font-bold text-white m-0 mb-4 flex items-center gap-2">
                      <Ticket size={18} className="text-[#10b981]" />
                      <span>Submit Support Ticket</span>
                    </h3>

                    {/* Purpose / Issue Category Shortcuts */}
                    <div className="mb-4">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Quick Issue Category</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "🔑 Portal & Passwords", subject: "Portal Login & Password Reset Request" },
                          { label: "📶 Wi-Fi & E-Learning", subject: "Campus Wi-Fi & Portal Connection Issue" },
                          { label: "📚 Unit Reg & Exams", subject: "Unit Registration / Exam Missing Mark Issue" },
                          { label: "💳 Fee Clearance", subject: "Fee Balance Statement & Slip Clearance" },
                          { label: "🛠️ General Support", subject: "General ICT & Campus Support Query" }
                        ].map((cat) => (
                          <button
                            key={cat.label}
                            type="button"
                            onClick={() => setTicketSubject(cat.subject)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#10b981]/20 border border-white/10 hover:border-[#10b981]/40 text-xs text-zinc-200 cursor-pointer transition-colors"
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <div>
                        <label className="text-xs text-zinc-400 font-semibold mb-1 block">Target Department</label>
                        <select 
                          value={ticketDeptId} 
                          onChange={e => setTicketDeptId(e.target.value)} 
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm outline-none cursor-pointer"
                        >
                          <option value="">Select Department (Default: Directorate of ICT)</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-zinc-400 font-semibold mb-1 block">Issue Subject</label>
                        <input 
                          value={ticketSubject} 
                          onChange={e => setTicketSubject(e.target.value)} 
                          placeholder="e.g. WiFi Access / Missing Exam Mark" 
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm outline-none" 
                        />
                      </div>

                      <div>
                        <label className="text-xs text-zinc-400 font-semibold mb-1 block">Detailed Description & Reg Number</label>
                        <textarea 
                          value={ticketDesc} 
                          onChange={e => setTicketDesc(e.target.value)} 
                          placeholder="Provide full details, your Student Registration Number, and course unit..." 
                          rows={4} 
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm outline-none resize-none" 
                        />
                      </div>

                      <button 
                        onClick={handleCreateTicket} 
                        disabled={creatingTicket || !ticketSubject.trim() || !ticketDesc.trim()} 
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-3 rounded-xl text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg mt-1 border-none"
                      >
                        {creatingTicket ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        <span>Submit Ticket to DeKUT Helpdesk</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ticket Tracking List */}
                <div className="lg:col-span-5">
                  <h3 className="text-base sm:text-lg font-bold text-white m-0 mb-4 flex items-center gap-2">
                    <ClockIcon size={18} className="text-purple-400" />
                    <span>Your Submitted Tickets</span>
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {tickets.map(ticket => (
                      <div key={ticket.id} className="glass-panel p-4 rounded-2xl border border-white/10 bg-white/5">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="font-semibold text-xs sm:text-sm text-white flex-1">{ticket.subject}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            ticket.status === 'open' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            ticket.status === 'resolved' ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" :
                            "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          }`}>
                            {ticket.status || "open"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 m-0 line-clamp-2 leading-relaxed">{ticket.description}</p>
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-500">
                          <span>Ref ID: #{ticket.id.slice(0, 8)}</span>
                          <span>Priority: Standard SLA</span>
                        </div>
                      </div>
                    ))}

                    {tickets.length === 0 && (
                      <div className="glass-panel p-6 text-center rounded-2xl border border-white/5">
                        <CheckCircle2 size={32} className="text-[#10b981] mx-auto mb-2 opacity-50" />
                        <h4 className="text-xs sm:text-sm font-semibold text-white m-0">No Active Tickets</h4>
                        <p className="text-xs text-zinc-400 m-0 mt-1">Submit a ticket if you encounter any system, academic, or facility issues.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        ) : tab === "My timetable" ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 relative">
            <div className="glass-panel p-4 sm:p-8 max-w-4xl mx-auto pb-28">
              
              {/* Header: Title, Semester Dates & Upload */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 pb-6 border-b border-white/5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white m-0">My Timetable</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 m-0">Upload & AI-schedule your DeKUT classes.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <label className="flex flex-col gap-1 text-xs text-zinc-400">
                      <span>Semester Start</span>
                      <input type="date" value={semesterStart} onChange={e => setSemesterStart(e.target.value)} className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-zinc-400">
                      <span>Semester End</span>
                      <input type="date" value={semesterEnd} onChange={e => setSemesterEnd(e.target.value)} className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none" />
                    </label>
                  </div>
                </div>

                <label className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-black font-semibold px-4 py-3 rounded-xl text-xs sm:text-sm cursor-pointer transition-colors shadow-lg flex-shrink-0">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  <span>Upload Image / PDF</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUploadTimetable} disabled={uploading} />
                </label>
              </div>

              {/* Innovative Timetable Carousel */}
              {timetables.length > 0 ? (
                <div className="mb-8">
                  {/* Carousel Header & Controls */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-[#10b981]" size={18} />
                      <h3 className="text-xs sm:text-sm font-bold text-white m-0 uppercase tracking-wider">
                        Timetable Files ({activeTimetableIdx + 1} of {timetables.length})
                      </h3>
                    </div>

                    {timetables.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTimetableIdx(prev => (prev === 0 ? timetables.length - 1 : prev - 1))}
                          className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                          title="Previous Timetable"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        
                        {/* Slide Dots */}
                        <div className="flex items-center gap-1 px-1">
                          {timetables.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveTimetableIdx(idx)}
                              className={`h-2 rounded-full transition-all cursor-pointer border-none p-0 ${
                                idx === activeTimetableIdx ? "w-6 bg-[#10b981]" : "w-2 bg-white/20 hover:bg-white/40"
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTimetableIdx(prev => (prev === timetables.length - 1 ? 0 : prev + 1))}
                          className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                          title="Next Timetable"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Carousel Card */}
                  <AnimatePresence mode="wait">
                    {(() => {
                      const safeIdx = activeTimetableIdx % timetables.length;
                      const t = timetables[safeIdx] || timetables[0];
                      if (!t) return null;
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, scale: 0.96, x: 20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.96, x: -20 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="glass-panel p-5 sm:p-6 rounded-3xl border border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 via-black/40 to-black/60 shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-40 h-40 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 grid place-items-center text-[#10b981]">
                                <CalendarDays size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-base text-white m-0 truncate max-w-xs">{t.title}</h4>
                                <span className="text-[11px] text-zinc-400">Uploaded {new Date(t.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <span className="text-xs text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-3 py-1 rounded-full flex items-center gap-1.5 font-semibold">
                              <ClockIcon size={12} /> {t.processing_status}
                            </span>
                          </div>

                          {t.processing_status !== "ready" && (
                            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-4">
                              {!timetableMetadata[t.id] ? (
                                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <p className="text-xs text-zinc-400 m-0">First, scan available classes & courses from this timetable image.</p>
                                  <button onClick={() => handleExtractMetadata(t.id)} disabled={extractingMetadataId === t.id} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-black font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-50 transition-all shadow-lg flex-shrink-0">
                                    {extractingMetadataId === t.id ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                                    <span>{extractingMetadataId === t.id ? "Scanning Timetable..." : "Scan Timetable"}</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Group selection */}
                                    <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-2">
                                      <div className="flex justify-between items-center">
                                        <label className="text-xs text-zinc-300 font-semibold block">1. Select Class/Group</label>
                                        <button 
                                          type="button" 
                                          onClick={() => handleExtractMetadata(t.id)} 
                                          disabled={extractingMetadataId === t.id} 
                                          className="text-[11px] text-[#10b981] hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-none p-0"
                                        >
                                          <RotateCw size={11} className={extractingMetadataId === t.id ? "animate-spin" : ""} />
                                          <span>{extractingMetadataId === t.id ? "Scanning..." : "Rescan"}</span>
                                        </button>
                                      </div>
                                      <select 
                                        value={selectedGroup[t.id] || ""} 
                                        onChange={e => {
                                          const newGrp = e.target.value;
                                          setSelectedGroup(prev => ({ ...prev, [t.id]: newGrp }));
                                          const meta = timetableMetadata[t.id];
                                          const grpCourses = newGrp && meta?.mapped?.[newGrp] ? meta.mapped[newGrp] : (meta?.courses || []);
                                          setSelectedCourses(prev => ({ ...prev, [t.id]: grpCourses }));
                                        }} 
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs outline-none focus:border-[#10b981]"
                                      >
                                        <option value="">Select a group...</option>
                                        {timetableMetadata[t.id].groups.map(g => <option key={g} value={g}>{g}</option>)}
                                      </select>
                                    </div>

                                    {/* Course Selection */}
                                    <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-2">
                                      <label className="text-xs text-zinc-300 font-semibold block">2. Select Your Courses</label>
                                      <input type="text" placeholder="Filter courses..." value={courseSearchFilters[t.id] || ""} onChange={e => setCourseSearchFilters(prev => ({...prev, [t.id]: e.target.value}))} className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs outline-none focus:border-[#10b981]" />
                                      <div className="max-h-32 overflow-y-auto bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-2 hide-scroll">
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
                                          <label key={c} className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer hover:text-white transition-colors">
                                            <input type="checkbox" checked={selectedCourses[t.id]?.includes(c) || false} onChange={(e) => {
                                              const checked = e.target.checked;
                                              setSelectedCourses(prev => {
                                                const curr = prev[t.id] || [];
                                                return { ...prev, [t.id]: checked ? [...curr, c] : curr.filter(x => x !== c) };
                                              });
                                            }} className="accent-[#10b981] w-4 h-4 rounded" />
                                            <span className="truncate">{c}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <button onClick={() => handleAnalyzeTimetable(t.id)} disabled={analyzingId === t.id || !selectedGroup[t.id] || (selectedCourses[t.id] || []).length === 0} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-black font-extrabold py-3 rounded-xl text-sm cursor-pointer disabled:opacity-50 hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)] transition-all">
                                    {analyzingId === t.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    <span>{analyzingId === t.id ? "Generating Schedule..." : "Generate AI Weekly Schedule"}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="glass-panel p-6 sm:p-10 text-center rounded-3xl border border-white/10 mb-8 bg-white/5">
                  <CalendarDays size={40} className="text-[#10b981] mx-auto mb-3 opacity-80" />
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">No Timetable Uploaded Yet</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto m-0 leading-relaxed">Upload an image or PDF of your class timetable, and KiliGuide AI will automatically build your interactive weekly carousel schedule!</p>
                </div>
              )}

              {/* Weekly Schedule Section */}
              {calendarEvents.length > 0 && (() => {
                const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
                  const idx = d === 0 ? 6 : d - 1;
                  if (!eventsByDay[idx]) eventsByDay[idx] = [];
                  eventsByDay[idx].push(ev);
                });
                Object.values(eventsByDay).forEach(arr => arr.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()));

                const fmt = (d: Date) => d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
                const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });
                const todayIdx = (() => { const d = now.getDay(); return d === 0 ? 6 : d - 1; })();
                const activeDayIndex = mobileDayIdx ?? (todayIdx < 6 ? todayIdx : 0);
                const isCurrentWeek = scheduleWeekOffset === 0;

                const COLORS = [
                  { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#10b981" },
                  { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)", text: "#8b5cf6" },
                  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", text: "#3b82f6" },
                  { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
                  { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.3)", text: "#ec4899" },
                  { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.3)", text: "#06b6d4" },
                ];
                const courseColorMap: Record<string, number> = {};
                let colorIdx = 0;
                calendarEvents.forEach(ev => {
                  const key = ev.title.split(" ").slice(0, 3).join(" ");
                  if (!(key in courseColorMap)) courseColorMap[key] = colorIdx++ % COLORS.length;
                });

                return (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    {/* Weekly Schedule Header & Pagination */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white m-0">Weekly Schedule</h3>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1 m-0">
                          {fmt(weekStart)} – {fmt(weekEnd)} &nbsp;·&nbsp; {eventsThisWeek.length} class{eventsThisWeek.length !== 1 ? "es" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button onClick={() => setScheduleWeekOffset(o => o - 1)} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold cursor-pointer hover:bg-white/10">← Prev</button>
                        {scheduleWeekOffset !== 0 && <button onClick={() => setScheduleWeekOffset(0)} className="px-3 py-1.5 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-xs font-semibold cursor-pointer">Today</button>}
                        <button onClick={() => setScheduleWeekOffset(o => o + 1)} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold cursor-pointer hover:bg-white/10">Next →</button>
                      </div>
                    </div>

                    {/* Filter Unit Pills */}
                    {allCourses.length > 1 && (
                      <div className="mb-6">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Filter Units</span>
                        <div className="flex flex-wrap gap-1.5">
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
                                  padding: "4px 10px",
                                  borderRadius: 100,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  border: `1px solid ${hidden ? "rgba(255,255,255,0.1)" : c.border}`,
                                  background: hidden ? "rgba(255,255,255,0.03)" : c.bg,
                                  color: hidden ? "#52525b" : c.text,
                                  textDecoration: hidden ? "line-through" : "none"
                                }}
                              >
                                {course}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MOBILE DAY SELECTOR TABS (< lg screens) */}
                    <div className="block lg:hidden mb-6">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 hide-scroll">
                        {DAYS.map((day, i) => {
                          const isToday = isCurrentWeek && i === todayIdx;
                          const isSelected = activeDayIndex === i;
                          const count = (eventsByDay[i] ?? []).length;
                          return (
                            <button
                              key={day}
                              onClick={() => setMobileDayIdx(i)}
                              className={`flex-1 min-w-[56px] py-2 px-2.5 rounded-xl border text-center cursor-pointer transition-all flex-shrink-0 ${
                                isSelected 
                                  ? "bg-[#10b981] border-[#10b981] text-black font-bold shadow-md" 
                                  : isToday 
                                    ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]" 
                                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                              }`}
                            >
                              <div className="text-[10px] uppercase font-bold tracking-wider">{day}</div>
                              <div className="text-sm font-extrabold mt-0.5">{weekDays[i].getDate()}</div>
                              {count > 0 && (
                                <div className={`text-[9px] font-bold mt-1 px-1 rounded-full ${isSelected ? "bg-black/20 text-black" : "bg-white/10 text-zinc-300"}`}>
                                  {count} class{count !== 1 ? "es" : ""}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Mobile Selected Day Agenda Cards */}
                      <div className="mt-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {DAYS[activeDayIndex]} ({fmt(weekDays[activeDayIndex])}) Classes
                          </span>
                          <span className="text-xs text-zinc-400">
                            {(eventsByDay[activeDayIndex] ?? []).length} Scheduled
                          </span>
                        </div>

                        {(eventsByDay[activeDayIndex] ?? []).length === 0 ? (
                          <div className="glass-panel p-6 text-center rounded-2xl border border-white/5">
                            <CheckCircle2 size={24} className="text-[#10b981] mx-auto mb-2 opacity-60" />
                            <p className="text-xs text-zinc-400 m-0">No classes scheduled for {DAYS[activeDayIndex]}. Enjoy your free day!</p>
                          </div>
                        ) : (
                          (eventsByDay[activeDayIndex] ?? []).map((ev, ei) => {
                            const key = ev.title.split(" ").slice(0, 3).join(" ");
                            const c = COLORS[courseColorMap[key] ?? 0];
                            const startStr = fmtTime(ev.starts_at);
                            const endStr = ev.ends_at ? fmtTime(ev.ends_at) : null;
                            return (
                              <div key={ev.id ?? ei} className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3 border" style={{ background: c.bg, borderColor: c.border }}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-black/40" style={{ color: c.text }}>
                                      {startStr} {endStr ? `- ${endStr}` : ""}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-white truncate m-0">{ev.title}</h4>
                                  {ev.location && <span className="text-xs text-zinc-400 mt-1 block">📍 {ev.location}</span>}
                                </div>
                                <button
                                  onClick={() => alert(`Alarm set successfully! You will be notified before ${ev.title} begins at ${startStr}.`)}
                                  className="p-2.5 rounded-full border bg-black/30 cursor-pointer flex-shrink-0"
                                  style={{ borderColor: c.border, color: c.text }}
                                  title="Set Alarm"
                                >
                                  <Bell size={16} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* DESKTOP 6-COLUMN GRID (≥ lg screens) */}
                    <div className="hidden lg:grid grid-cols-6 gap-3">
                      {DAYS.map((day, i) => {
                        const isToday = isCurrentWeek && i === todayIdx;
                        const dayEvents = eventsByDay[i] ?? [];
                        return (
                          <div key={day}>
                            <div className={`text-center p-2.5 rounded-xl mb-2 border ${isToday ? "bg-[#10b981]/15 border-[#10b981]/30 text-[#10b981]" : "bg-white/5 border-white/5 text-zinc-400"}`}>
                              <div className="text-[10px] font-bold uppercase tracking-wider">{day}</div>
                              <div className="text-base font-extrabold mt-0.5 text-white">{weekDays[i].getDate()}</div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {dayEvents.length === 0 ? (
                                <div className="p-3 text-center text-xs text-zinc-600 italic">Free</div>
                              ) : (
                                dayEvents.map((ev, ei) => {
                                  const key = ev.title.split(" ").slice(0, 3).join(" ");
                                  const c = COLORS[courseColorMap[key] ?? 0];
                                  const startStr = fmtTime(ev.starts_at);
                                  return (
                                    <div key={ev.id ?? ei} className="p-3 rounded-xl border relative pr-8 transition-transform hover:-translate-y-0.5" style={{ background: c.bg, borderColor: c.border }}>
                                      <span className="text-[10px] font-bold block mb-1" style={{ color: c.text }}>{startStr}</span>
                                      <h5 className="text-xs font-bold text-white leading-tight m-0 line-clamp-2">{ev.title}</h5>
                                      <button 
                                        onClick={() => alert(`Alarm set! Notifying before ${ev.title} at ${startStr}.`)}
                                        className="absolute top-2 right-2 w-5 h-5 rounded-full border bg-black/20 grid place-items-center cursor-pointer"
                                        style={{ borderColor: c.border, color: c.text }}
                                        title="Set Alarm"
                                      >
                                        <Bell size={11} />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

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
