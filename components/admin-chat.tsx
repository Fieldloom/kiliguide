"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { MarkdownRender as MarkdownMessage } from "./markdown-render";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, Send, Loader2, Bot, Sparkles, Trash2, ShieldCheck, X, Paperclip, 
  PanelLeft, History, Plus, MessageSquare, ChevronRight, CornerDownLeft, FileText, ExternalLink
} from "lucide-react";
import { DocumentViewerModal } from "./document-viewer-modal";

type Source = { title: string; page?: number | null };
type Message = { id: string; role: "user" | "assistant"; content: string; sources?: Source[]; confidence?: number; escalate?: boolean; };
type Conversation = { id: string; title: string; messages: Message[]; createdAt: number };

export function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeSourceModal, setActiveSourceModal] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; base64: string; name: string; type: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load local admin conversations
    const stored = localStorage.getItem("kiliguide_admin_convs");
    if (stored) {
      const parsed = JSON.parse(stored);
      setConversations(parsed);
      if (parsed.length > 0) {
        setActiveConvId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-KE";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => prev + (prev.length > 0 ? " " : "") + transcript);
      };
      recognition.onerror = (event: any) => { console.error("Speech error", event); setIsListening(false); };
      recognition.onend = () => { setIsListening(false); };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Speech recognition not supported in this browser.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const saveConversation = (id: string, newMessages: Message[]) => {
    const title = newMessages[0]?.content.substring(0, 36) || "New Conversation";
    let updated = [...conversations];
    const existing = updated.findIndex(c => c.id === id);
    if (existing >= 0) {
      updated[existing].messages = newMessages;
    } else {
      updated.unshift({ id, title, messages: newMessages, createdAt: Date.now() });
    }
    setConversations(updated);
    localStorage.setItem("kiliguide_admin_convs", JSON.stringify(updated));
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setHistoryOpen(false);
  };

  const ask = async (promptQuery?: string) => {
    const q = (promptQuery || query).trim();
    if (!q || !supabase) return;
    setQuery("");
    setAsking(true);

    const convId = activeConvId || crypto.randomUUID();
    if (!activeConvId) setActiveConvId(convId);

    const newUserMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);

    try {
      let { data, error } = await supabase.functions.invoke("chat", {
        body: {
          question: q,
          conversationId: convId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          admin_mode: true,
          attachment: attachment ? { base64: attachment.base64, name: attachment.name, type: attachment.type } : undefined
        }
      });

      if (data?.escalate) {
         const tempId = crypto.randomUUID();
         setMessages(prev => [...prev, { id: tempId, role: "assistant", content: "Thinking & searching university knowledge base..." }]);
         
         const fallbackRes = await supabase.functions.invoke("chat", {
           body: {
             question: q,
             conversationId: convId,
             messages: newMessages.map(m => ({ role: m.role, content: m.content })),
             admin_mode: true,
             attachment: attachment ? { base64: attachment.base64, name: attachment.name, type: attachment.type } : undefined,
             forceWebSearch: true
           }
         });
         data = fallbackRes.data;
         error = fallbackRes.error;
         
         setMessages(prev => prev.filter(m => m.id !== tempId));
      }
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (error) throw new Error(error.message);

      const updatedMessages: Message[] = [...newMessages, {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: data.answer || data.response || "No response received.",
        sources: data.sources,
        confidence: data.confidence
      }];
      setMessages(updatedMessages);
      saveConversation(convId, updatedMessages);
    } catch (e) {
      const errorMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "Sorry, there was an error processing your administrative request." };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setAsking(false);
    }
  };

  const deleteConv = (id: string, e: any) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem("kiliguide_admin_convs", JSON.stringify(updated));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const samplePrompts = [
    "Summarize system health and document indexing metrics",
    "List all open support tickets needing department escalation",
    "Check recent user signups and assigned campus roles",
    "Run web crawler diagnostic on university portals"
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 520, borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(6,10,14,0.6)", backdropFilter: "blur(24px)", overflow: "hidden", position: "relative" }}>
      
      {/* Top Controls Header Bar */}
      <header style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* History Sidebar Toggle Button */}
          <button 
            onClick={() => setHistoryOpen(!historyOpen)}
            style={{ 
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 14, 
              background: historyOpen ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)", 
              border: historyOpen ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)", 
              color: historyOpen ? "#10b981" : "#ececec", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" 
            }}
          >
            <PanelLeft size={18} />
            <span>Chat History</span>
            {conversations.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 100, background: "#10b981", color: "#000" }}>
                {conversations.length}
              </span>
            )}
          </button>

          <span style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#10b981", padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em" }}>
            <ShieldCheck size={14} /> ADMIN AI
          </span>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={startNewChat}
          style={{ 
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 100, 
            background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", border: "none", 
            fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" 
          }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </header>

      {/* Workspace Body: Collapsible Side Menu + Main Thread */}
      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
        
        {/* Backdrop overlay for mobile drawer */}
        {historyOpen && (
          <div 
            onClick={() => setHistoryOpen(false)} 
            style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            className="md:hidden"
          />
        )}

        {/* Collapsible Side Menu with Curved Edges */}
        <AnimatePresence>
          {historyOpen && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              style={{
                width: 290,
                flexShrink: 0,
                background: "rgba(10, 16, 24, 0.95)",
                backdropFilter: "blur(24px)",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0 24px 24px 0",
                display: "flex", flexDirection: "column",
                position: "absolute", top: 0, bottom: 0, left: 0, zIndex: 40,
                boxShadow: "12px 0 32px rgba(0,0,0,0.5)",
                padding: 16
              }}
              className="md:relative md:shadow-none"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                  <History size={16} /> RECENT ADMIN CHATS
                </span>
                <button onClick={() => setHistoryOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#a1a1aa", padding: 6, borderRadius: 10, cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>

              <button 
                onClick={startNewChat}
                style={{ 
                  width: "100%", padding: "12px 16px", borderRadius: 16, 
                  background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", 
                  color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", 
                  fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, 
                  cursor: "pointer", marginBottom: 16 
                }}
              >
                <Sparkles size={16} /> Start Fresh Chat
              </button>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {conversations.map(c => {
                  const isActive = activeConvId === c.id;
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => { setActiveConvId(c.id); setMessages(c.messages); setHistoryOpen(false); }} 
                      style={{ 
                        padding: "12px 14px", borderRadius: 16, cursor: "pointer", 
                        background: isActive ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.02)", 
                        color: isActive ? "#fff" : "#a1a1aa", 
                        border: isActive ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.05)",
                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                        <MessageSquare size={15} style={{ color: isActive ? "#10b981" : "#71717a", flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteConv(c.id, e)} 
                        style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", opacity: isActive ? 1 : 0.6 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}

                {conversations.length === 0 && (
                  <div style={{ padding: 32, textAlign: "center", color: "#71717a", fontSize: 13 }}>
                    No prior admin sessions found.
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Thread Area - Takes Full Width when history is collapsed */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", minWidth: 0 }}>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 120px", display: "flex", flexDirection: "column", gap: 20 }}>
            {messages.length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", maxWidth: 560, width: "100%", padding: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 24, background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 32px rgba(16,185,129,0.2)" }}>
                  <ShieldCheck size={32} color="#10b981" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10 }}>KiliGuide Admin Intelligence</h2>
                <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                  Ask me to summarize system logs, query knowledge documents, analyze support tickets, or generate system administrative insights.
                </p>

                {/* Sample Prompt Chips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {samplePrompts.map(sp => (
                    <button
                      key={sp}
                      onClick={() => ask(sp)}
                      style={{
                        padding: "12px 16px", borderRadius: 16, background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)", color: "#ececec", fontSize: 12,
                        fontWeight: 600, textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                    >
                      <span>{sp}</span>
                      <ChevronRight size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 12 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.25 }} 
                    style={{ display: "flex", gap: 14, flexDirection: m.role === "user" ? "row-reverse" : "row", maxWidth: "100%" }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", background: m.role === "user" ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: m.role === "user" ? "1px solid rgba(255,255,255,0.15)" : "none", boxShadow: m.role === "assistant" ? "0 4px 16px rgba(16,185,129,0.3)" : "none" }}>
                      {m.role === "user" ? <span style={{ fontSize: 13, fontWeight: 800 }}>A</span> : <Bot size={20} />}
                    </div>

                    <div style={{ maxWidth: "85%", background: m.role === "user" ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))" : "rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: 24, borderTopRightRadius: m.role === "user" ? 6 : 24, borderTopLeftRadius: m.role === "assistant" ? 6 : 24, border: m.role === "user" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)", color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                      {m.role === "user" ? <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p> : <MarkdownMessage content={m.content} />}
                      {m.sources && m.sources.length > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#71717a", fontWeight: 700 }}>SOURCES:</span>
                          {m.sources.map((s, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveSourceModal(s)}
                              style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#10b981", padding: "3px 10px", borderRadius: 100, fontWeight: 600, fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                              title="Click to view document source"
                            >
                              <FileText size={11} />
                              <span>{s.title} {s.page ? `(Pg. ${s.page})` : ""}</span>
                              <ExternalLink size={10} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {asking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 14, background: "linear-gradient(135deg, #10b981, #059669)", display: "grid", placeItems: "center", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}><Bot size={20} color="#fff" /></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <motion.div animate={{ scale: [0.6, 1.2, 0.6] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} style={{ width: 8, height: 8, borderRadius: 4, background: "#10b981" }} />
                      <motion.div animate={{ scale: [0.6, 1.2, 0.6] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} style={{ width: 8, height: 8, borderRadius: 4, background: "#10b981" }} />
                      <motion.div animate={{ scale: [0.6, 1.2, 0.6] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} style={{ width: 8, height: 8, borderRadius: 4, background: "#10b981" }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            <div ref={endRef} />
          </div>

          {/* Floating Input Area Bar */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, background: "linear-gradient(0deg, rgba(6,10,14,0.95) 0%, rgba(6,10,14,0) 100%)" }}>
            <div style={{ maxWidth: 840, margin: "0 auto" }}>
              
              {/* Attachment Pill */}
              <AnimatePresence>
                {attachment && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "6px 14px", borderRadius: 100, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📎 {attachment.name}</span>
                    <button onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                style={{ 
                  display: "flex", alignItems: "center", gap: 10, borderRadius: 24, padding: "10px 14px", 
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(12, 18, 26, 0.92)", 
                  backdropFilter: "blur(20px)", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" 
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  accept=".pdf,image/png,image/jpeg,image/webp" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const b64 = (ev.target?.result as string).split(",")[1];
                      setAttachment({ file, base64: b64, name: file.name, type: file.type });
                    };
                    reader.readAsDataURL(file);
                  }} 
                />

                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa", cursor: "pointer", width: 38, height: 38, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
                  title="Attach file or image"
                >
                  <Paperclip size={18} />
                </button>

                <textarea 
                  disabled={asking} 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !asking) { e.preventDefault(); ask(); } }} 
                  placeholder={asking ? "Processing query..." : isListening ? "Listening to voice input..." : "Ask AI Assistant..."} 
                  rows={1} 
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 14, color: "#fff", minHeight: 24, maxHeight: 160, opacity: asking ? 0.7 : 1 }} 
                />

                <button 
                  onClick={toggleListening} 
                  style={{ background: "none", border: "none", color: isListening ? "#10b981" : "#a1a1aa", cursor: "pointer", padding: 6, transition: "color 0.2s", flexShrink: 0 }}
                  title="Voice input"
                >
                  {isListening ? (
                    <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}><Mic size={20} style={{ color: "#10b981" }} /></motion.div>
                  ) : <Mic size={20} />}
                </button>

                <button 
                  onClick={() => ask()} 
                  disabled={!query.trim() || asking} 
                  style={{ 
                    width: 38, height: 38, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", 
                    background: query.trim() && !asking ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.05)", 
                    border: "1px solid rgba(255,255,255,0.15)", cursor: query.trim() && !asking ? "pointer" : "not-allowed",
                    boxShadow: query.trim() && !asking ? "0 4px 14px rgba(16,185,129,0.3)" : "none", flexShrink: 0
                  }}
                >
                  {asking ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} color={query.trim() ? "#000" : "#71717a"} />}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <DocumentViewerModal source={activeSourceModal} onClose={() => setActiveSourceModal(null)} />
    </div>
  );
}
