"use client";
import { motion } from "framer-motion";
import { Mail, X } from "lucide-react";

export function EscalateModal({ 
  payload, 
  onClose 
}: { 
  payload: { subject: string, body: string } | null, 
  onClose: () => void 
}) {
  if (!payload) return null;

  const departments = [
    { name: "Vice Chancellor", email: "vc@dkut.ac.ke" },
    { name: "Registrar Academic Affairs", email: "registraraa@dkut.ac.ke" },
    { name: "Admissions Office", email: "admissionsoffice@dkut.ac.ke" },
    { name: "Public Relations", email: "pro@dkut.ac.ke" },
    { name: "Data Protection", email: "dataprotection@dkut.ac.ke" },
    { name: "Marketing", email: "marketing@dkut.ac.ke" },
    { name: "IT / Webmaster", email: "webmaster@dkut.ac.ke" }
  ];

  /** Strip markdown formatting so the email reads as clean plain text */
  const stripMarkdown = (md: string): string =>
    md
      .replace(/```[\s\S]*?```/g, '')           // remove code blocks
      .replace(/`([^`]+)`/g, '$1')               // inline code → plain
      .replace(/\*\*([^*]+)\*\*/g, '$1')         // **bold** → plain
      .replace(/\*([^*]+)\*/g, '$1')             // *italic* → plain
      .replace(/^#{1,6}\s+/gm, '')               // ### headings → plain
      .replace(/^\s*[-*]\s+/gm, '• ')            // bullet lists
      .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + ' ') // numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // [text](url) → text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')    // images → remove
      .replace(/>\s?/gm, '')                     // blockquotes
      .replace(/\n{3,}/g, '\n\n')                // collapse excess newlines
      .trim();

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: "100%", maxWidth: 420, background: "rgba(20, 20, 22, 0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: 24, boxShadow: "0 30px 60px rgba(0,0,0,0.6)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", padding: 4, display: "flex" }}>
          <X size={20} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
            <Mail size={20} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Escalate to Human</h2>
        </div>
        <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 20 }}>
          Select the department to contact. On mobile phones, this opens your native <strong>Gmail / Mail App</strong> with pre-crafted conversation context ready to send.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "50vh", overflowY: "auto", paddingRight: 4 }} className="hide-scroll">
          {departments.map(dept => (
            <div key={dept.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{dept.name}</span>
                <span style={{ fontSize: 11, color: "#a1a1aa" }}>{dept.email}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button 
                  onClick={() => handleDraft(dept.email, dept.name, false)} 
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 10, color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  title="Open in Mail/Gmail App"
                >
                  <Mail size={14} /> Mail App
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
