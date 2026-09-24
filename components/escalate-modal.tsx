"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, X } from "lucide-react";
import { supabase } from "../lib/supabase";

export function EscalateModal({ 
  payload, 
  onClose,
  onOpenTicketChat
}: { 
  payload: { subject: string, body: string } | null;
  onClose: () => void;
  onOpenTicketChat?: (ticketId: string) => void;
}) {
  const [departments, setDepartments] = useState<{ id?: string, name: string, email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!payload || !supabase) return;
    setLoading(true);
    supabase
      .from("departments")
      .select("id, name, email")
      .order("name")
      .then(({ data }) => {
        const validDepts = (data || []).filter(d => d.email && d.email.trim().length > 0);
        if (validDepts.length > 0) {
          setDepartments(validDepts);
        } else {
          setDepartments([
            { name: "Vice Chancellor / Executive Office", email: "admin@university.ac.ke" },
            { name: "Registrar Academic Affairs", email: "registrar@university.ac.ke" },
            { name: "Admissions & Enrolment", email: "admissions@university.ac.ke" },
            { name: "Finance & Fee Enquiries", email: "finance@university.ac.ke" },
            { name: "IT & Student Portal Support", email: "support@university.ac.ke" }
          ]);
        }
        setLoading(false);
      });
  }, [payload]);

  if (!payload) return null;

  const stripMarkdown = (md: string): string =>
    md
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/>\s?/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const handleCreatePlatformTicket = async (deptId?: string, deptName?: string) => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to submit a platform ticket.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("institution_id")
        .eq("id", user.id)
        .single();

      const instId = profile?.institution_id || "00000000-0000-0000-0000-000000000001";
      const topic = payload.subject.replace("Question about: ", "");

      const { data: newTicket, error: tErr } = await supabase
        .from("tickets")
        .insert({
          created_by: user.id,
          institution_id: instId,
          department_id: deptId || null,
          subject: topic,
          description: `Escalated AI Query: ${topic}\n\nKiliGuide AI Excerpt:\n"${stripMarkdown(payload.body).substring(0, 300)}..."`,
          status: "open"
        })
        .select("id")
        .single();

      if (tErr) throw tErr;

      if (newTicket) {
        await supabase.from("ticket_messages").insert({
          ticket_id: newTicket.id,
          author_id: user.id,
          body: `Hello ${deptName || "Support Team"},\n\nI need official assistance with: ${topic}.\n\nAI Excerpt:\n"${stripMarkdown(payload.body).substring(0, 300)}..."`
        });

        onClose();
        if (onOpenTicketChat) {
          onOpenTicketChat(newTicket.id);
        }
      }
    } catch (err: any) {
      alert("Failed to submit ticket: " + err.message);
    }
  };

  const handleDraft = (email: string, deptName: string, forceWeb = false) => {
    const cleanResponse = stripMarkdown(payload.body);
    let excerpt = cleanResponse.substring(0, 300);
    const lastPeriod = excerpt.lastIndexOf('.');
    if (lastPeriod > 100) excerpt = excerpt.substring(0, lastPeriod + 1);
    else excerpt += '...';

    const enhancedBody = [
      `Dear ${deptName},`,
      '',
      `I am writing to seek official university guidance on a topic I inquired about via KiliGuide AI.`,
      '',
      `Topic: ${payload.subject.replace('Question about: ', '')}`,
      '',
      `KiliGuide AI Response Excerpt:`,
      `"${excerpt}"`,
      '',
      `Kindly provide official assistance or clarification regarding this matter.`,
      '',
      `Thank you for your assistance.`,
      '',
      `Kind regards,`,
      `[Your Name]`,
      `[Your Registration / Staff Number]`,
    ].join('\n');

    if (forceWeb) {
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(enhancedBody)}`;
      window.open(url, '_blank');
    } else {
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(enhancedBody)}`;
      window.location.href = mailtoUrl;
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: "100%", maxWidth: 480, background: "rgba(20, 20, 22, 0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: 24, boxShadow: "0 30px 60px rgba(0,0,0,0.6)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", padding: 4, display: "flex" }}>
          <X size={20} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
            <MessageSquare size={20} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Escalate to Department</h2>
        </div>
        <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 20 }}>
          Submit a 2-way platform support ticket for real-time tracking or send an email directly to department staff.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }} className="hide-scroll">
          {departments.map(dept => (
            <div key={dept.email} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{dept.name}</span>
                <span style={{ fontSize: 11, color: "#a1a1aa" }}>{dept.email}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button 
                  onClick={() => handleCreatePlatformTicket(dept.id, dept.name)} 
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  title="Open 2-way live platform ticket"
                >
                  <MessageSquare size={14} /> Open Live Ticket
                </button>
                <button 
                  onClick={() => handleDraft(dept.email, dept.name, true)} 
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 10, color: "#60a5fa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  title="Open draft in Gmail (Web)"
                >
                  <Mail size={14} /> Gmail Web
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
