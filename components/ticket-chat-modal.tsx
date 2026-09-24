"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, Send, ShieldCheck, Ticket as TicketIcon, User, X, Loader2, Sparkles, MessageCircle, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export type TicketItem = {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed" | string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  department_id?: string;
  institution_id?: string;
  departments?: { name: string };
  profiles?: { full_name: string; email: string };
};

export type TicketMessageItem = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string; role?: string };
};

export function TicketChatModal({
  ticketId,
  currentUserId,
  userRole,
  onClose,
  onStatusChange
}: {
  ticketId: string | null;
  currentUserId?: string;
  userRole?: string;
  onClose: () => void;
  onStatusChange?: () => void;
}) {
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [messages, setMessages] = useState<TicketMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticketId || !supabase) return;
    const client = supabase;
    setLoading(true);

    const loadTicketAndMessages = async () => {
      // 1. Fetch ticket metadata
      const { data: ticketData, error: tErr } = await client
        .from("tickets")
        .select("*, departments(name), profiles:created_by(full_name, email)")
        .eq("id", ticketId)
        .single();

      if (tErr) console.error("Error loading ticket:", tErr);
      else setTicket(ticketData as TicketItem);

      // 2. Fetch existing ticket chat messages
      const { data: msgData, error: mErr } = await client
        .from("ticket_messages")
        .select("*, profiles:author_id(full_name)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (mErr) console.error("Error loading ticket messages:", mErr);
      else setMessages(msgData || []);

      setLoading(false);
    };

    loadTicketAndMessages();

    // 3. Real-time Supabase Subscription for new messages in this ticket thread
    const channel = client
      .channel(`ticket-chat-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`
        },
        async (payload) => {
          const newMsg = payload.new as TicketMessageItem;
          // Fetch author name if available
          const { data: authProfile } = await client
            .from("profiles")
            .select("full_name")
            .eq("id", newMsg.author_id)
            .single();

          const fullMsg: TicketMessageItem = {
            ...newMsg,
            profiles: authProfile ? { full_name: authProfile.full_name } : undefined
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, fullMsg];
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!ticketId) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !supabase || sending) return;

    const textToSend = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const authorId = user?.id || currentUserId;
      if (!authorId) throw new Error("Not authenticated");

      const { data: newMsg, error } = await supabase
        .from("ticket_messages")
        .insert([
          {
            ticket_id: ticketId,
            author_id: authorId,
            body: textToSend
          }
        ])
        .select("*, profiles:author_id(full_name)")
        .single();

      if (error) throw error;

      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg as TicketMessageItem];
        });
      }

      // Update ticket updated_at timestamp
      await supabase
        .from("tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", ticketId);

    } catch (err: any) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + (err.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!supabase || !ticket || statusUpdating) return;
    setStatusUpdating(true);

    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;

      setTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const isStaffOrAdmin = ["administrator", "super_admin", "dept_admin", "staff", "lecturer", "department"].includes(userRole || "");

  const getStatusBadge = (st: string) => {
    switch (st?.toLowerCase()) {
      case "resolved":
        return <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 size={13} /> Resolved</span>;
      case "in_progress":
      case "in progress":
        return <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock size={13} /> In Progress</span>;
      case "closed":
        return <span className="bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded-full text-xs font-semibold">Closed</span>;
      default:
        return <span className="bg-blue-500/15 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><AlertCircle size={13} /> Open</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[9999] flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl bg-zinc-950/90 border border-white/15 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden h-[85vh] max-h-[750px]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-white/[0.03] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                  {ticket?.departments?.name || "Support Ticket"}
                </span>
                {ticket && getStatusBadge(ticket.status)}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1 truncate m-0">
                {ticket?.subject || "Support Ticket Conversation"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Staff Quick Action Bar */}
        {isStaffOrAdmin && ticket && (
          <div className="px-4 py-2.5 bg-emerald-500/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-zinc-400 font-medium">
              Author: <strong className="text-white">{ticket.profiles?.full_name || "Student"}</strong> ({ticket.profiles?.email || "User"})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-medium">Update Status:</span>
              <button
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus("in_progress")}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  ticket.status === "in_progress"
                    ? "bg-amber-500 text-black border-amber-400 font-bold"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                }`}
              >
                In Progress
              </button>
              <button
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus("resolved")}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  ticket.status === "resolved"
                    ? "bg-emerald-500 text-black border-emerald-400 font-bold"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                Resolved
              </button>
              <button
                disabled={statusUpdating}
                onClick={() => handleUpdateStatus("open")}
                className={`px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  ticket.status === "open"
                    ? "bg-blue-500 text-black border-blue-400 font-bold"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                }`}
              >
                Reopen
              </button>
            </div>
          </div>
        )}

        {/* Chat Message Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
              <span className="text-sm font-medium">Loading ticket conversation...</span>
            </div>
          ) : (
            <>
              {/* Initial Ticket Problem Statement / Description */}
              {ticket && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <User size={14} className="text-emerald-400" /> {ticket.profiles?.full_name || "Ticket Creator"}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(ticket.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed m-0 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* Message List */}
              {messages.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs sm:text-sm">
                  <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
                  No messages yet. Send a message below to start communicating directly with support.
                </div>
              ) : (
                messages.map((msg) => {
                  const isUserSender = msg.author_id === currentUserId || msg.author_id === ticket?.created_by;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUserSender ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-semibold text-zinc-400">
                          {isUserSender ? "You" : msg.profiles?.full_name || "Support Team"}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                          isUserSender
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none"
                            : "bg-zinc-900 border border-white/10 text-zinc-100 rounded-tl-none"
                        }`}
                      >
                        <p className="m-0 whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Reply Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-black/40 flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message reply..."
            disabled={sending}
            className="flex-1 bg-zinc-900/90 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="bg-emerald-500 text-black font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 hover:bg-emerald-400 cursor-pointer disabled:opacity-50 transition-all flex-shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span className="hidden sm:inline">Send Reply</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
