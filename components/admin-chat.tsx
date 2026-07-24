"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Loader2, Bot, Sparkles, Trash2, ShieldCheck, X, Paperclip } from "lucide-react";

type Source = { title: string; page?: number | null };
type Message = { id: string; role: "user" | "assistant"; content: string; sources?: Source[]; confidence?: number; escalate?: boolean; };
type Conversation = { id: string; title: string; messages: Message[]; createdAt: number };

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
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#10b981", textDecoration: "underline" }}>{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; base64: string; name: string; type: string } | null>(null);
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
    const title = newMessages[0]?.content.substring(0, 40) || "New Conversation";
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

  const ask = async () => {
    if (!query.trim() || !supabase) return;
    const q = query.trim();
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
         setMessages(prev => [...prev, { id: tempId, role: "assistant", content: "Searching official government and university sources (kuccps.net, helb.co.ke, etc.)..." }]);
         
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

  return (
    <div style={{ display: "flex", height: "calc(100vh - 140px)", background: "rgba(0,0,0,0.2)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
      {/* Sidebar for Chat History */}
      <div style={{ width: 300, background: "rgba(0,0,0,0.4)", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20 }}>
          <button onClick={() => { setActiveConvId(null); setMessages([]); }} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
            <Sparkles size={16} /> New Admin Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 20px" }}>
          {conversations.map(c => (
            <div key={c.id} onClick={() => { setActiveConvId(c.id); setMessages(c.messages); }} style={{ padding: "12px 16px", borderRadius: 12, cursor: "pointer", background: activeConvId === c.id ? "rgba(255,255,255,0.05)" : "transparent", color: activeConvId === c.id ? "#fff" : "#a1a1aa", fontSize: 13, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }} className="conv-item">
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
              <button onClick={(e) => deleteConv(c.id, e)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, opacity: activeConvId === c.id ? 1 : 0 }} className="del-btn">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {conversations.length === 0 && <p style={{ textAlign: "center", color: "#71717a", fontSize: 13, marginTop: 40 }}>No previous chats.</p>}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
            <ShieldCheck size={14} /> ADMIN MODE
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "40px 40px 100px", display: "flex", flexDirection: "column", gap: 24 }}>
          {messages.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", maxWidth: 400 }}>
              <div style={{ width: 64, height: 64, borderRadius: 24, background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <ShieldCheck size={32} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Admin Assistant</h2>
              <p style={{ color: "#a1a1aa", fontSize: 15, lineHeight: 1.6 }}>Ask me to query system logs, analyze user statistics, or summarize tickets. I have unrestricted access to knowledge base metadata.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", gap: 16, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, display: "grid", placeItems: "center", background: m.role === "user" ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>
                    {m.role === "user" ? <span style={{ fontSize: 14, fontWeight: 700 }}>A</span> : <Bot size={20} />}
                  </div>
                  <div style={{ maxWidth: "80%", background: m.role === "user" ? "rgba(255,255,255,0.05)" : "transparent", padding: m.role === "user" ? "16px 20px" : "8px 0", borderRadius: 24, borderTopRightRadius: m.role === "user" ? 4 : 24, borderTopLeftRadius: m.role === "assistant" ? 4 : 24, color: "#fff" }}>
                    {m.role === "user" ? <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>{m.content}</p> : <MarkdownMessage content={m.content} />}
                    {m.sources && m.sources.length > 0 && (
                      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {m.sources.map((s, idx) => (
                          <span key={idx} style={{ fontSize: 11, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "4px 8px", borderRadius: 100 }}>{s.title}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {asking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #10b981, #059669)", display: "grid", placeItems: "center" }}><Bot size={20} color="#fff" /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} style={{ width: 6, height: 6, borderRadius: 3, background: "#10b981" }} />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: 3, background: "#10b981" }} />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: 3, background: "#10b981" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            
            {/* Attachment Pill */}
            <AnimatePresence>
              {attachment && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "6px 12px", borderRadius: 100, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.name}</span>
                  <button onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div className="glazed-widget" animate={asking ? { boxShadow: ["0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0px rgba(16, 185, 129, 0)", "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 15px rgba(16, 185, 129, 0.3)", "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0px rgba(16, 185, 129, 0)"] } : {}} transition={asking ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}} style={{ display: "flex", alignItems: "flex-end", gap: 12, borderRadius: 24, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}>
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf,image/png,image/jpeg,image/webp" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const b64 = (ev.target?.result as string).split(",")[1];
                  setAttachment({ file, base64: b64, name: file.name, type: file.type });
                };
                reader.readAsDataURL(file);
              }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa", cursor: "pointer", padding: 8, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                <Paperclip size={20} />
              </button>

              <textarea disabled={asking} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !asking) { e.preventDefault(); ask(); } }} placeholder={asking ? "Running admin query..." : isListening ? "Listening..." : "Query system knowledge..."} rows={1} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 16, color: "#fff", minHeight: 32, maxHeight: 200, opacity: asking ? 0.7 : 1 }} />
              <button onClick={toggleListening} style={{ background: "none", border: "none", color: isListening ? "#19c37d" : "#a1a1aa", cursor: "pointer", padding: 4, transition: "color 0.2s" }}>
                {isListening ? (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}><Mic size={20} style={{ color: "#19c37d" }} /></motion.div>
                ) : <Mic size={20} />}
              </button>
              <motion.button onClick={() => ask()} disabled={!query.trim() || asking} style={{ width: 40, height: 40, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: query.trim() || asking ? "linear-gradient(180deg, rgba(25, 195, 125, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)" }}>
                {asking ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "grid", placeItems: "center" }}><Loader2 size={18} color="#fff" /></motion.div> : <Send size={18} color={query.trim() ? "#fff" : "#a1a1aa"} />}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
