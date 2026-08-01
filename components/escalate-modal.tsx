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

  const handleDraft = (email: string) => {
    const url = `mailto:${email}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.body)}`;
    window.location.href = url;
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
        <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 24 }}>Select the relevant department. This will draft an email using your default email client with the AI's conversation context already attached.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "50vh", overflowY: "auto", paddingRight: 4 }}>
          {departments.map(dept => (
            <button key={dept.email} onClick={() => handleDraft(dept.email)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", cursor: "pointer", transition: "0.2s", textAlign: "left" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{dept.name}</span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>{dept.email}</span>
              </div>
              <Mail size={16} color="#a1a1aa" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
