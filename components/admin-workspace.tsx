"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, BarChart3, Bell, Bot, Building2, Check, ChevronDown, ChevronRight, ChevronUp,
  FileText, LayoutDashboard, Menu, MessageSquareText, Search,
  ShieldCheck, Ticket, Upload, UploadCloud, Users, X, Settings, RefreshCw, Trash2, Archive, CheckCircle2, Sparkles, Globe, XCircle, Clock, Zap,
  Plus, RotateCcw, SlidersHorizontal, Filter, ExternalLink, Eye, FileCode, Folder, Pencil, Mail, AlertTriangle, Send
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { scrapeDeKut } from "../app/actions";
import { AdminChat } from "./admin-chat";
import { InstallButton } from "./install-button";

type Tab = "Overview" | "AI Assistant" | "Documents" | "Notices" | "Tickets" | "Users" | "Analytics" | "System Health" | "Institutions" | "Web Crawler";
const nav: { label: Tab; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "AI Assistant", icon: MessageSquareText },
  { label: "Documents", icon: FileText },
  { label: "Notices", icon: Bell },
  { label: "Tickets", icon: Ticket },
  { label: "Users", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "System Health", icon: Settings },
  { label: "Web Crawler", icon: Globe as any },
];

const D = {
  bg: "transparent",
  sidebar: "rgba(0,0,0,0.4)",
  card: "rgba(255,255,255,0.02)",
  cardHover: "rgba(16,185,129,0.05)",
  border: "rgba(255,255,255,0.08)",
  muted: "#71717a",
  text: "#ececec",
  accent: "#10b981",
};

export function AdminWorkspace({ role }: { role?: string }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [done, setDone] = useState<number[]>([]);
  const [noticeModal, setNoticeModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  
  const [stats, setStats] = useState({ users: 0, docs: 0, tickets: 0, notices: 0, healthScore: 100, chartData: [0,0,0,0,0,0,0] });

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    client.auth.getUser().then(async ({ data: { user } }) => {
      const { data: prof } = user ? await client.from("profiles").select("role").eq("id", user.id).single() : { data: null };
      const { data: roles } = user ? await client.from("user_roles").select("role").eq("user_id", user.id) : { data: null };
      const isSuperAdmin = prof?.role === "super_admin" || roles?.some(r => r.role === "super_admin");

      let docsQuery = client.from("documents").select("*", { count: "exact", head: true }).eq("status", "active");
      let healthDocsQuery = client.from("documents").select("processing_status");

      if (!isSuperAdmin && user?.id) {
        docsQuery = docsQuery.eq("uploaded_by", user.id);
        healthDocsQuery = healthDocsQuery.eq("uploaded_by", user.id);
      }

      Promise.all([
        client.from("profiles").select("*", { count: "exact", head: true }),
        docsQuery,
        client.from("tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        client.from("notices").select("*", { count: "exact", head: true }),
        healthDocsQuery,
        client.from("messages").select("created_at").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]).then(([u, d, t, n, healthDocs, chartMsgs]) => {
        let healthyCount = 0;
        let totalDocs = 0;
        if (healthDocs.data) {
          totalDocs = healthDocs.data.length;
          healthyCount = healthDocs.data.filter((doc: any) => doc.processing_status === "ready" || doc.processing_status === "archived" || doc.processing_status === null).length;
        }
        const healthScore = totalDocs === 0 ? 100 : Math.round((healthyCount / totalDocs) * 100);

        const days = [0,0,0,0,0,0,0];
        if (chartMsgs.data) {
          const now = new Date();
          chartMsgs.data.forEach((msg: any) => {
            const msgDate = new Date(msg.created_at);
            const diffDays = Math.floor(Math.abs(now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 7) days[6 - diffDays]++;
          });
        }

        setStats({
          users: u.count ?? 0,
          docs: d.count ?? 0,
          tickets: t.count ?? 0,
          notices: n.count ?? 0,
          healthScore,
          chartData: days
        });
      });
    });
  }, [tab]);

  const go = (next: Tab) => { setTab(next); setMenu(false); };

  const allNavItems = role === "super_admin" ? [...nav, { label: "Institutions" as Tab, icon: Building2 }] : nav;

  return (
    <main className="bg-aurora" style={{ minHeight: "100vh", background: D.bg, color: D.text, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
        {/* Sidebar */}
        <aside
          style={{
            background: "linear-gradient(165deg, rgba(13, 22, 33, 0.96) 0%, rgba(6, 10, 16, 0.98) 100%)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          className={`
            fixed z-50 flex flex-col
            max-lg:top-3 max-lg:bottom-3 max-lg:left-3 max-lg:w-[calc(100vw-48px)] max-lg:max-w-[290px] max-lg:rounded-[32px] max-lg:border max-lg:border-[#10b981]/30 max-lg:shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_32px_rgba(16,185,129,0.15)] max-lg:overflow-hidden
            lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:w-[260px] lg:flex-shrink-0 lg:rounded-none lg:border-r lg:border-white/10
            ${menu ? "translate-x-0 opacity-100" : "-translate-x-[calc(100%+30px)] opacity-0 lg:-translate-x-full lg:opacity-0"}
          `}
        >
          {/* Top Ambient Glow & Logo */}
          <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${D.border}`, background: "radial-gradient(ellipse at top left, rgba(16,185,129,0.18), transparent 70%)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: "18px", overflow: "hidden", display: "grid", placeItems: "center", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", flexShrink: 0, boxShadow: "0 4px 14px rgba(16,185,129,0.2)" }}>
                  <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.2)" }} />
                </span>
                <div>
                  <strong style={{ fontSize: 16, display: "block", color: D.text, letterSpacing: "-0.03em" }}>KiliGuide</strong>
                  <small style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: D.accent, background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 8px", borderRadius: "100px" }}>SUPERADMIN</small>
                </div>
              </div>
              <button onClick={() => setMenu(false)} style={{ color: D.muted, padding: 8, borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }} className="lg:hidden">
                <X size={18} />
              </button>
            </div>
          </div>

          <nav style={{ flex: 1, overflowY: "auto", padding: "20px 14px" }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: D.muted, padding: "4px 10px 12px" }}>WORKSPACE NAVIGATION</p>
            {allNavItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => go(label)}
                style={{
                  display: "flex", width: "100%", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 20, fontSize: 13, fontWeight: tab === label ? 800 : 500,
                  background: tab === label ? "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.06))" : "transparent",
                  color: tab === label ? "#fff" : D.muted,
                  border: tab === label ? "1px solid rgba(16,185,129,0.35)" : "1px solid transparent",
                  boxShadow: tab === label ? "0 6px 20px rgba(16,185,129,0.18)" : "none",
                  cursor: "pointer", transition: "all 0.2s ease",
                  marginBottom: 6
                }}
              >
                <Icon size={18} style={{ color: tab === label ? D.accent : D.muted }} />
                <span>{label}</span>
                {tab === label && <div style={{ width: 7, height: 7, borderRadius: "50%", background: D.accent, marginLeft: "auto", boxShadow: `0 0 10px ${D.accent}` }} />}
              </button>
            ))}
            <div style={{ marginTop: 16 }}>
              <InstallButton style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, color: D.muted, cursor: "pointer", background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}` }} />
            </div>
          </nav>

          <div style={{ padding: "16px 20px", borderTop: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: "16px", background: "linear-gradient(135deg, #10b981, #059669)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}>SA</span>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 13, display: "block", color: D.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Super Administrator</b>
                <small style={{ fontSize: 11, color: D.accent, fontWeight: 600 }}>System Control</small>
              </div>
            </div>
          </div>
        </aside>

        {menu && <button aria-label="Close" onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", border: "none" }} className="lg:hidden" />}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "margin-left 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }} className={menu ? "lg:ml-[260px]" : "lg:ml-0"}>
          {/* Top Sticky Header */}
          <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "0 20px", borderBottom: `1px solid ${D.border}`, background: "rgba(6,10,14,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 480 }}>
              <button onClick={() => setMenu(!menu)} style={{ color: D.text, padding: "8px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Menu size={18} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Menu</span>
              </button>
              
              <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, borderRadius: 100, border: `1px solid ${D.border}`, background: "rgba(255,255,255,0.03)", padding: "8px 16px", cursor: "text" }}>
                <Search size={16} style={{ color: D.muted, flexShrink: 0 }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: D.text }}
                  placeholder="Search workspace…"
                />
              </label>
            </div>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 120px" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", height: tab === "AI Assistant" ? "calc(100vh - 140px)" : "auto" }}>
              {tab === "Tickets" ? <TicketsWorkspace /> : tab === "Overview" ? (
                <Overview done={done} setDone={setDone} onTab={go} stats={stats} />
              ) : tab === "AI Assistant" ? (
                <AdminChat />
              ) : (
                <WorkspaceTab tab={tab} onCompose={() => setNoticeModal(true)} onUpload={() => setUploadModal(true)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Curved Navigation Bar */}
      <nav className="flex lg:hidden" style={{ position: "fixed", bottom: 12, left: 12, right: 12, zIndex: 40, background: "rgba(10, 16, 24, 0.92)", backdropFilter: "blur(24px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.12)", padding: "8px 12px", boxShadow: "0 12px 32px rgba(0,0,0,0.6)", justifyContent: "space-between", alignItems: "center" }}>
        {[
          { label: "Overview", icon: LayoutDashboard },
          { label: "Documents", icon: FileText },
          { label: "AI Assistant", icon: MessageSquareText },
          { label: "Tickets", icon: Ticket },
          { label: "Web Crawler", icon: Globe as any },
        ].map(({ label, icon: Icon }) => {
          const isActive = tab === label;
          return (
            <button
              key={label}
              onClick={() => go(label as Tab)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 12px", borderRadius: 20,
                background: isActive ? "rgba(16,185,129,0.2)" : "transparent",
                color: isActive ? D.accent : D.muted,
                border: isActive ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                cursor: "pointer", flex: 1, transition: "all 0.2s"
              }}
            >
              <Icon size={18} style={{ color: isActive ? D.accent : D.muted }} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 500 }}>{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>

      {noticeModal && <Compose onClose={() => setNoticeModal(false)} />}
      {uploadModal && <UploadDocumentModal onClose={() => setUploadModal(false)} />}
    </main>
  );
}

function Metric({ icon: Icon, value, label, color, sublabel }: { icon: any; value: string; label: string; color: string; sublabel?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      style={{
        borderRadius: 22,
        background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "22px 24px",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 110, height: 110, background: color, opacity: 0.12, filter: "blur(35px)", borderRadius: "50%", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: D.muted, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 38, height: 38, borderRadius: 14, background: `${color}18`, border: `1px solid ${color}35`, display: "grid", placeItems: "center", color, boxShadow: `0 4px 14px ${color}25` }}>
          <Icon size={18} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <b style={{ fontSize: 36, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{value}</b>
        {sublabel && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: `${color}15`, color, border: `1px solid ${color}30` }}>
            {sublabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Chart({ data = [0, 0, 0, 0, 0, 0, 0] }: { data?: number[] }) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d">("7d");
  const maxVal = Math.max(...data, 10);
  
  const pts = data.map(v => 170 - (v / maxVal) * 125);
  const xs = [30, 120, 210, 300, 390, 480, 570];
  
  let path = `M ${xs[0]} ${pts[0]}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const xc = (xs[i] + xs[i + 1]) / 2;
    const yc = (pts[i] + pts[i + 1]) / 2;
    path += ` Q ${xs[i]} ${pts[i]}, ${xc} ${yc}`;
  }
  path += ` T ${xs[xs.length - 1]} ${pts[pts.length - 1]}`;

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <section
      style={{
        borderRadius: 24,
        background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "24px 26px",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 16, color: "#ffffff", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
            <Activity size={18} style={{ color: D.accent }} />
            AI Queries Over Time
          </h2>
          <p style={{ fontSize: 12, color: D.muted, marginTop: 2 }}>RAG Assistant interactions across campus.</p>
        </div>

        <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 12, border: `1px solid ${D.border}` }}>
          {(["7d", "30d"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              style={{
                padding: "4px 12px",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                background: timeframe === t ? "rgba(16,185,129,0.2)" : "transparent",
                color: timeframe === t ? D.accent : D.muted,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 16, height: 180, width: "100%" }}>
        <svg viewBox="0 0 600 200" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <line x1="30" y1="45" x2="570" y2="45" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="30" y1="95" x2="570" y2="95" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          <line x1="30" y1="145" x2="570" y2="145" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

          <path d={`${path} L 570 175 L 30 175 Z`} fill="url(#areaGradient)" />

          <path d={path} fill="none" stroke="#10b981" strokeWidth="3" filter="url(#glowEffect)" />

          {xs.map((x, i) => (
            <g key={x}>
              <circle cx={x} cy={pts[i]} r="5" fill="#090d14" stroke="#10b981" strokeWidth="2.5" />
              <text x={x} y={pts[i] - 10} fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">{data[i] ?? 0}</text>
              <text x={x} y="195" fill={D.muted} fontSize="11" fontWeight="600" textAnchor="middle">{dayLabels[i]}</text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

function Health({ score = 100 }: { score?: number }) {
  const bars = [
    { name: "Document processing", val: score, detail: "PDF & Web ingestion pipeline" },
    { name: "System connectivity", val: 100, detail: "Supabase DB & Edge Functions" },
    { name: "Vector indexing", val: score >= 90 ? 98 : score, detail: "776D Embedding search" }
  ];
  return (
    <section
      style={{
        borderRadius: 24,
        background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "24px 26px",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 16, color: "#ffffff", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
            <Zap size={18} style={{ color: D.accent }} />
            Knowledge Base Health
          </h2>
          <p style={{ fontSize: 12, color: D.muted, marginTop: 2 }}>RAG index integrity & system readiness.</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: "rgba(16,185,129,0.15)", color: D.accent, border: "1px solid rgba(16,185,129,0.3)" }}>
          ~120ms latency
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 24, flexWrap: "wrap" }}>
        <div style={{ width: 130, height: 130, borderRadius: "50%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}>
          <svg style={{ position: "absolute", inset: -4, width: 138, height: 138, transform: "rotate(-90deg)" }}>
            <circle cx="69" cy="69" r="62" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle
              cx="69"
              cy="69"
              r="62"
              fill="none"
              stroke={score >= 90 ? "#10b981" : "#f59e0b"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 62}`}
              strokeDashoffset={`${2 * Math.PI * 62 * (1 - score / 100)}`}
              style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))", transition: "all 1s ease" }}
            />
          </svg>
          <div style={{ textAlign: "center" }}>
            <b style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", display: "block", lineHeight: 1.1 }}>{score}%</b>
            <span style={{ fontSize: 11, color: score >= 90 ? D.accent : "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {score >= 90 ? "Optimal" : "Review"}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 16 }}>
          {bars.map((x) => (
            <div key={x.name}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: D.text, marginBottom: 6 }}>
                <span>{x.name}</span>
                <span style={{ color: D.accent, fontWeight: 800 }}>{x.val}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    background: "linear-gradient(90deg, #10b981 0%, #14b8a6 100%)",
                    width: `${x.val}%`,
                    boxShadow: "0 0 12px rgba(16, 185, 129, 0.5)",
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Overview({ done, setDone, onTab, stats }: { done: number[]; setDone: (x: number[]) => void; onTab: (x: Tab) => void; stats: any }) {
  return (
    <>
      <div
        style={{
          marginBottom: 28,
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(13, 22, 33, 0.6) 60%, rgba(6, 10, 16, 0.8) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          padding: "32px 36px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div style={{ position: "absolute", top: -50, left: -50, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        <div style={{ position: "relative", zIndex: 10, maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 100, background: "rgba(16,185,129,0.18)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
              CAMPUS ADMIN
            </span>
            <span style={{ fontSize: 12, color: D.muted }}>• Academic Year 2026/2027</span>
          </div>

          <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>
            Welcome back, <span style={{ background: "linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Admin</span> 👋
          </h1>
          <p style={{ marginTop: 8, color: "#d4d4d8", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            A healthier, more informed campus. Manage students, knowledge base documents, notices, and support tickets in real-time.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 10 }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTab("Documents")}
            style={{
              padding: "10px 18px",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#09090b",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Upload size={16} /> Manage Documents
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTab("Notices")}
            style={{
              padding: "10px 18px",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 700,
              background: "rgba(255,255,255,0.06)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Bell size={16} /> New Notice
          </motion.button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 24 }}>
        <Metric icon={Users} color="#10b981" value={stats.users.toString()} label="Active users" sublabel="Live Tenant Members" />
        <Metric icon={FileText} color="#3b82f6" value={stats.docs.toString()} label="Live documents" sublabel="RAG Vectorized" />
        <Metric icon={Ticket} color="#f59e0b" value={stats.tickets.toString()} label="Open tickets" sublabel="Requires Attention" />
        <Metric icon={Bell} color="#ec4899" value={stats.notices.toString()} label="Live notices" sublabel="Broadcast Active" />
      </div>

      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1.2fr 0.8fr", marginBottom: 40 }} className="xl:grid-cols-[1.2fr_0.8fr] grid-cols-1">
        <Chart data={stats.chartData} />
        <Health score={stats.healthScore} />
      </div>
    </>
  );
}

function WorkspaceTab({ tab, onCompose, onUpload }: { tab: Tab; onCompose: () => void; onUpload: () => void }) {
  return (
    <section>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: D.accent }}>ADMINISTRATION</p>
          <h1 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, marginTop: 8, color: D.text, letterSpacing: "-0.02em" }}>{tab}</h1>
          <p style={{ marginTop: 8, color: D.muted, fontSize: 15 }}>Manage your university {tab.toLowerCase()} from this workspace.</p>
        </div>
        {["Notices", "Documents"].includes(tab) && (
          <button onClick={tab === "Documents" ? onUpload : onCompose} style={{ borderRadius: 100, background: D.accent, padding: "12px 24px", fontSize: 14, fontWeight: 700, color: "#000", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", border: "none", boxShadow: `0 4px 12px ${D.accent}44` }}>
            <Upload size={16} />
            {tab === "Documents" ? "Upload document" : `Create ${tab.slice(0, -1)}`}
          </button>
        )}
      </div>
      {tab === "Documents" ? (
        <><OfficialSourceImport /><DocumentLibrary /></>
      ) : tab === "Tickets" ? (
        <TicketsWorkspace />
      ) : tab === "Notices" ? (
        <NoticesWorkspace />
      ) : tab === "Users" ? (
        <UsersWorkspace />
      ) : tab === "Institutions" ? (
        <InstitutionsWorkspace />
      ) : tab === "AI Assistant" ? (
        <AILiveFeed />
      ) : tab === "System Health" ? (
        <SystemHealthWorkspace />
      ) : tab === "Web Crawler" ? (
        <WebCrawlerWorkspace />
      ) : (
        <div style={{ borderRadius: 12, background: D.card, padding: 48, textAlign: "center", border: `1px solid ${D.border}` }}>
          <Bot size={36} style={{ color: D.muted, margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 17, fontWeight: 700, color: D.text }}>{tab} workspace</h2>
          <p style={{ marginTop: 8, maxWidth: 420, margin: "8px auto 0", fontSize: 13, color: D.muted, lineHeight: 1.7 }}>
            This section is ready for live Supabase records.
          </p>
        </div>
      )}
    </section>
  );
}

// ── SYSTEM HEALTH ────────────────────────────────────────────────────────
function SystemHealthWorkspace() {
  const [imageLimit, setImageLimit] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase?.from("app_settings").select("image_generation_limit").eq("id", "global").single().then(({ data }) => {
      if (data) setImageLimit(data.image_generation_limit);
    });
  }, []);

  const save = async () => {
    if (!supabase) return;
    setSaving(true);
    await supabase.from("app_settings").upsert({ id: "global", image_generation_limit: imageLimit });
    setSaving(false);
    alert("Settings saved!");
  };

  return (
    <section style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text, marginBottom: 24 }}>System Settings</h2>
      
      <div style={{ padding: 24, borderRadius: 12, background: D.bg, border: `1px solid ${D.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: D.text }}>Image Generation Quota</h3>
        <p style={{ fontSize: 13, color: D.muted, marginTop: 4, marginBottom: 16 }}>Set the maximum number of images a user can generate using the /image command.</p>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input 
            type="number" 
            min={0}
            value={imageLimit} 
            onChange={(e) => setImageLimit(parseInt(e.target.value) || 0)}
            style={{ width: 100, background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, color: D.text, padding: "8px 12px", borderRadius: 8, outline: "none" }}
          />
          <button 
            disabled={saving}
            onClick={save}
            style={{ background: D.accent, color: "#000", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving..." : "Save Limit"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── TICKETS ─────────────────────────────────────────────────────────────
function TicketsWorkspace() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  useEffect(() => {
    supabase?.from("tickets").select(`*, profiles:created_by(full_name, email), departments(name, email)`).order("created_at", { ascending: false }).limit(50).then(({ data }) => setTickets(data || []));
  }, []);

  const updateStatus = async (id: string, status: string, creatorId: string, subject: string) => {
    if(!supabase) return;
    await supabase.from("tickets").update({ status }).eq("id", id);
    setTickets(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    
    if (status === "resolved") {
      supabase.functions.invoke("send-push", {
        body: { recipientId: creatorId, title: "Ticket Resolved", body: `Your ticket "${subject}" has been marked as resolved.`, url: "/portal/student", tag: `ticket-${id}` }
      });
    }
  };

  const handleEscalate = async (t: any) => {
    if (!supabase) return;
    setEscalatingId(t.id);
    const { data: departments } = await supabase.from("departments").select("id, name, email");
    const { data, error } = await supabase.functions.invoke("escalate-ticket", {
      body: { ticket: { subject: t.subject, description: t.description, authorName: t.profiles?.full_name || "Unknown" }, departments }
    });
    setEscalatingId(null);
    if (error || !data || !data.department_email) {
      alert("AI Escalation failed: " + (error?.message || "Unknown error"));
      return;
    }
    const mailto = `mailto:${data.department_email}?subject=Ticket Escalation: ${encodeURIComponent(t.subject)}&body=${encodeURIComponent(data.body)}`;
    window.location.href = mailto;
  };

  return (
    <section style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text, marginBottom: 24 }}>Support Tickets</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {tickets.map(t => (
          <div key={t.id} style={{ padding: 24, borderRadius: 12, background: D.bg, border: `1px solid ${D.border}`, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <b style={{ color: D.text, fontSize: 16, display: "block", marginBottom: 6 }}>{t.subject}</b>
                <span style={{ fontSize: 13, color: D.muted }}>From: {t.profiles?.full_name || "Unknown"} | Dept: {t.departments?.name || "Unassigned"}</span>
              </div>
              <select value={t.status} onChange={e => updateStatus(t.id, e.target.value, t.created_by, t.subject)} style={{ padding: "6px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: t.status === "open" ? "#f59e0b22" : "#19c37d22", color: t.status === "open" ? "#f59e0b" : D.accent, outline: "none", border: "none", cursor: "pointer", appearance: "none" }}>
                <option value="open">OPEN</option>
                <option value="in_progress">IN PROGRESS</option>
                <option value="resolved">RESOLVED</option>
                <option value="closed">CLOSED</option>
              </select>
            </div>
            <p style={{ fontSize: 14, color: D.text, whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8, border: `1px solid ${D.border}`, lineHeight: 1.6 }}>{t.description}</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => handleEscalate(t)} disabled={escalatingId === t.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#8b5cf615", color: "#8b5cf6", padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, border: "1px solid #8b5cf644", cursor: "pointer", opacity: escalatingId === t.id ? 0.5 : 1 }}>
                <Sparkles size={16} /> {escalatingId === t.id ? "Drafting..." : "Auto-Escalate with AI"}
              </button>
            </div>
          </div>
        ))}
        {tickets.length === 0 && <p style={{ color: D.muted, fontSize: 14 }}>No tickets found.</p>}
      </div>
    </section>
  );
}

// ── NOTICES ─────────────────────────────────────────────────────────────
function NoticesWorkspace() {
  const [notices, setNotices] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);

  useEffect(() => {
    supabase?.from("notices").select("*").order("published_at", { ascending: false }).then(({ data }) => setNotices(data || []));
  }, []);

  const remove = async (id: string) => {
    if(!supabase || !confirm("Are you sure you want to delete this notice?")) return;
    setDeletingId(id);
    await supabase.from("notices").delete().eq("id", id);
    setNotices(ns => ns.filter(n => n.id !== id));
    setDeletingId(null);
  };

  const handleUpdated = (updated: any) => {
    setNotices(ns => ns.map(n => n.id === updated.id ? updated : n));
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", minWidth: 0, overflow: "hidden" }}>
      {notices.map(n => (
        <article 
          key={n.id} 
          style={{ 
            borderRadius: 24, 
            background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", 
            padding: "20px 24px", 
            border: `1px solid ${D.border}`,
            backdropFilter: "blur(16px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            minWidth: 0
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 100, background: "rgba(16,185,129,0.15)", color: D.accent, border: "1px solid rgba(16,185,129,0.3)", textTransform: "uppercase" }}>
                {n.category || "General Notice"}
              </span>
              <span style={{ fontSize: 12, color: D.muted, display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} />
                {new Date(n.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <button 
                onClick={() => setEditingNotice(n)} 
                style={{ 
                  background: "rgba(59,130,246,0.12)", 
                  border: "1px solid rgba(59,130,246,0.3)", 
                  color: "#3b82f6", 
                  padding: "6px 14px", 
                  borderRadius: 12, 
                  cursor: "pointer", 
                  fontSize: 12, 
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Pencil size={14} />
                Edit
              </button>

              <button 
                onClick={() => remove(n.id)} 
                disabled={deletingId === n.id}
                style={{ 
                  background: "rgba(239,68,68,0.1)", 
                  border: "1px solid rgba(239,68,68,0.3)", 
                  color: "#ef4444", 
                  padding: "6px 14px", 
                  borderRadius: 12, 
                  cursor: deletingId === n.id ? "not-allowed" : "pointer", 
                  fontSize: 12, 
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Trash2 size={14} />
                {deletingId === n.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          <div style={{ width: "100%", minWidth: 0 }}>
            <h3 style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 800, color: D.text, marginBottom: 8, lineHeight: 1.4, wordBreak: "break-word" }}>
              {n.title}
            </h3>
            <p style={{ fontSize: 14, color: D.muted, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {n.body || n.summary}
            </p>
          </div>
        </article>
      ))}

      {notices.length === 0 && (
        <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.02)", padding: 48, textAlign: "center", border: `1px solid ${D.border}` }}>
          <Bell size={36} style={{ color: D.muted, margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text }}>No Notices Published</h3>
          <p style={{ marginTop: 6, fontSize: 13, color: D.muted }}>Click "Create Notice" above to publish a campus announcement.</p>
        </div>
      )}

      {editingNotice && (
        <EditNoticeModal 
          notice={editingNotice} 
          onClose={() => setEditingNotice(null)} 
          onUpdated={handleUpdated} 
        />
      )}
    </section>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────
function UsersWorkspace() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    if (!supabase) { setLoading(false); return; }
    const client = supabase;
    setLoading(true);
    const { data: { user } } = await client.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: prof } = await client.from("profiles").select("role, institution_id").eq("id", user.id).single();
    const { data: roles } = await client.from("user_roles").select("role").eq("user_id", user.id);
    const isSuperAdmin = prof?.role === "super_admin" || roles?.some(r => r.role === "super_admin");

    let query = client.from("profiles").select(`*, user_roles(role), institutions(name)`).order("created_at", { ascending: false });

    if (!isSuperAdmin && prof?.institution_id) {
      query = query.eq("institution_id", prof.institution_id);
    }

    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    if (!supabase) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    setUsers(users.map(u => u.id === userId ? { ...u, user_roles: [{ role: newRole }] } : u));
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!supabase || !confirm(`Permanently delete user ${name}?`)) return;
    // Calling an admin function to delete user or deleting profile triggers cascade
    await supabase.from("profiles").delete().eq("id", userId);
    setUsers(users.filter(u => u.id !== userId));
  };

  return (
    <section style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}` }}>
      <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${D.border}` }}>
            <th style={{ paddingBottom: 16, fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", color: D.muted, textAlign: "left" }}>USER</th>
            <th style={{ paddingBottom: 16, fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", color: D.muted, textAlign: "left" }}>ROLE</th>
            <th style={{ paddingBottom: 16, fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", color: D.muted, textAlign: "left" }}>JOINED</th>
            <th style={{ paddingBottom: 16, fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", color: D.muted, textAlign: "right" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: `1px solid ${D.border}` }}>
              <td style={{ padding: "20px 16px 20px 0" }}>
                <b style={{ display: "block", color: D.text }}>{u.full_name || "Unknown"}</b>
              </td>
              <td style={{ padding: "20px 16px 20px 0" }}>
                <span style={{ borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, background: "#6366f122", color: "#6366f1", textTransform: "uppercase" }}>
                  {u.user_roles?.[0]?.role || "student"}
                </span>
              </td>
              <td style={{ padding: "20px 16px 20px 0", color: D.muted }}>{new Date(u.created_at).toLocaleDateString()}</td>
              <td style={{ padding: "20px 0", textAlign: "right" }}>
                <select value={u.user_roles?.[0]?.role || "student"} onChange={e => updateRole(u.id, e.target.value)} style={{ background: "transparent", border: `1px solid ${D.border}`, color: D.text, padding: "6px 10px", borderRadius: 6, outline: "none", marginRight: 12, fontSize: 12 }}>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="dept_admin">Dept Admin</option>
                  <option value="administrator">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <button onClick={() => deleteUser(u.id, u.full_name)} style={{ background: "transparent", border: "1px solid #ef444444", color: "#ef4444", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── LIVE AI FEED ─────────────────────────────────────────────────────────────
function AILiveFeed() {
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    supabase?.from("messages").select("*, profiles(full_name)").eq("role", "user").order("created_at", { ascending: false }).limit(20).then(({ data }) => setMessages(data || []));
  }, []);

  return (
    <section style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text, marginBottom: 24 }}>Live AI Interactions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map(m => (
          <div key={m.id} style={{ padding: 20, borderRadius: 12, background: D.bg, border: `1px solid ${D.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: D.accent }}>{m.profiles?.full_name || "Unknown User"}</span>
              <span style={{ fontSize: 12, color: D.muted }}>{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p style={{ fontSize: 15, color: D.text, lineHeight: 1.6 }}>{m.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Official Source Import ─────────────────────────────────────────────────
function OfficialSourceImport() {
  const [url, setUrl] = useState("https://www.dkut.ac.ke/");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const ingest = async () => {
    if (!supabase) { setStatus("Supabase is not configured."); return; }
    setBusy(true); setStatus("Fetching the official page...");
    const result = await scrapeDeKut(url);
    if (result.error) { setBusy(false); setStatus(`Failed: ${result.error}`); return; }
    setStatus("Saving document record...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); setStatus("Session expired. Sign in again."); return; }
    const { data: profile } = await supabase.from("profiles").select("institution_id").eq("id", user.id).single();
    const path = `admin/${user.id}/${crypto.randomUUID()}.txt`;
    const { error: se } = await supabase.storage.from("documents").upload(path, result.text || "", { contentType: "text/plain" });
    if (se) { setBusy(false); setStatus(se.message); return; }
    const { data: doc, error: de } = await supabase.from("documents").insert({ title: result.title || "Webpage Document", category: "Administration", source_url: url, storage_path: path, file_type: "txt", uploaded_by: user.id, institution_id: profile?.institution_id || "00000000-0000-0000-0000-000000000001", metadata: { processing_status: "processing" } }).select("id").single();
    if (de) { setBusy(false); setStatus(de.message); return; }
    setStatus("Creating embeddings...");
    const { error } = await supabase.functions.invoke("ingest-document", { body: { documentId: doc.id, text: result.text } });
    setBusy(false);
    setStatus(error ? `Uploaded, but indexing failed: ${error.message}` : `✓ "${result.title}" scraped and indexed!`);
  };

  const upload = async () => {
    if (!supabase || !file) return;
    setBusy(true); setStatus("Uploading document...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); setStatus("Session expired. Sign in again."); return; }
    const { data: profile } = await supabase.from("profiles").select("institution_id").eq("id", user.id).single();
    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const path = `admin/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: se } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (se) { setBusy(false); setStatus(se.message); return; }
    const { data: doc, error: de } = await supabase.from("documents").insert({ title: file.name.replace(/\.[^.]+$/, ""), category: "Administration", storage_path: path, file_type: ext, uploaded_by: user.id, institution_id: profile?.institution_id || "00000000-0000-0000-0000-000000000001", metadata: { processing_status: ext === "txt" ? "processing" : "uploaded_pending_extraction", original_name: file.name } }).select("id,title").single();
    if (de) { setBusy(false); setStatus(de.message); return; }
    if (ext === "txt") {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke("ingest-document", { body: { documentId: doc.id, text } });
      const failed = error || (data && data.success === false) || data?.error;
      const errMsg = error?.message || data?.error || "Unknown error";
      setStatus(failed ? `Uploaded but indexing failed: ${errMsg}` : `✓ ${doc.title} indexed into ${data?.chunks || 0} chunks.`);
    } else {
      setStatus(`Extracting text from ${ext.toUpperCase()}...`);
      const { data, error } = await supabase.functions.invoke("process-document", { body: { documentId: doc.id, storagePath: path, extension: ext } });
      const failed = error || (data && data.success === false) || data?.error;
      const errMsg = error?.message || data?.error || "Unknown error";
      setStatus(failed ? `Extraction failed: ${errMsg}` : `✓ ${doc.title} indexed into ${data?.chunks || 0} chunks.`);
    }
    setBusy(false);
  };

  const suggestions: [string, string][] = [
    ["Registration rules", "registration.dkut.ac.ke/index.php/international/admission/rules"],
    ["University home", "www.dkut.ac.ke/index.php"],
    ["Admissions portal", "admissions.dkut.ac.ke"],
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section Header Card */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          borderRadius: 24,
          background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,10,14,0.6))",
          padding: "20px 24px",
          border: "1px solid rgba(16,185,129,0.25)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: "linear-gradient(135deg, #10b981, #059669)", display: "grid", placeItems: "center", color: "#000", flexShrink: 0, boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
            <UploadCloud size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "clamp(15px, 4vw, 17px)", fontWeight: 800, color: D.text, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, lineHeight: 1.4 }}>
              Add Knowledge & Import Documents
              <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 100, background: "rgba(16,185,129,0.2)", color: D.accent, border: "1px solid rgba(16,185,129,0.4)", whiteSpace: "nowrap", flexShrink: 0, display: "inline-flex", alignItems: "center" }}>Fast Ingestion</span>
            </h2>
            <p style={{ fontSize: 13, color: D.muted, marginTop: 2 }}>Upload PDF, DOCX, TXT files or scrape official campus URLs directly into AI memory.</p>
          </div>
        </div>
        <button style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, color: D.text, width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center" }}>
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginTop: 16 }}
          >
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              {/* Card 1: Upload File CTA */}
              <section style={{ borderRadius: 24, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <FileCode size={20} style={{ color: D.accent }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text }}>Direct File Upload</h3>
                </div>
                <p style={{ fontSize: 13, color: D.muted, lineHeight: 1.6, marginBottom: 20 }}>
                  Upload handbook PDFs, timetables, or course notices. Text is extracted and indexed automatically.
                </p>

                <div style={{ borderRadius: 18, border: `2px dashed ${file ? D.accent : "rgba(255,255,255,0.15)"}`, background: file ? "rgba(16,185,129,0.05)" : "rgba(0,0,0,0.2)", padding: 24, textAlign: "center", transition: "all 0.2s" }}>
                  <UploadCloud size={32} style={{ color: file ? D.accent : D.muted, margin: "0 auto 10px" }} />
                  <label style={{ cursor: "pointer", display: "block" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: D.text, display: "block" }}>
                      {file ? file.name : "Click or drag file to upload"}
                    </span>
                    <span style={{ fontSize: 12, color: D.muted, marginTop: 4, display: "block" }}>
                      Supports PDF, DOCX, TXT, Images (Max 25MB)
                    </span>
                    <input onChange={e => setFile(e.target.files?.[0] ?? null)} accept=".pdf,.docx,.txt,image/*" type="file" style={{ display: "none" }} />
                  </label>
                </div>

                <button 
                  disabled={busy || !file} 
                  onClick={upload} 
                  style={{ 
                    width: "100%", marginTop: 16, borderRadius: 16, 
                    background: busy || !file ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #10b981, #059669)", 
                    padding: "14px 20px", fontSize: 14, fontWeight: 800, 
                    color: busy || !file ? D.muted : "#000", 
                    cursor: busy || !file ? "not-allowed" : "pointer", border: "none", 
                    boxShadow: file && !busy ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  <Upload size={18} />
                  {busy ? "Processing Document…" : file ? `Confirm & Upload ${file.name.slice(0, 20)}...` : "Choose File to Upload"}
                </button>
              </section>

              {/* Card 2: Web URL Scrape */}
              <section style={{ borderRadius: 24, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Globe size={20} style={{ color: "#3b82f6" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text }}>Scrape Webpage URL</h3>
                </div>
                <p style={{ fontSize: 13, color: D.muted, lineHeight: 1.6, marginBottom: 16 }}>
                  Scrape any official <b style={{ color: D.text }}>dkut.ac.ke</b> page directly into the knowledge base.
                </p>

                <label style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: D.muted, marginBottom: 8 }}>
                  OFFICIAL TARGET URL
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    value={url} 
                    onChange={e => setUrl(e.target.value)} 
                    style={{ flex: 1, borderRadius: 14, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "12px 14px", fontSize: 13, outline: "none" }}
                    placeholder="https://www.dkut.ac.ke/..."
                  />
                </div>

                <button 
                  disabled={busy} 
                  onClick={ingest} 
                  style={{ 
                    width: "100%", marginTop: 16, borderRadius: 16, 
                    background: busy ? "rgba(255,255,255,0.05)" : "#3b82f6", 
                    padding: "14px 20px", fontSize: 14, fontWeight: 800, 
                    color: busy ? D.muted : "#fff", 
                    cursor: busy ? "not-allowed" : "pointer", border: "none",
                    boxShadow: !busy ? "0 4px 16px rgba(59,130,246,0.3)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  <Globe size={18} />
                  {busy ? "Fetching Page Content…" : "Scrape & Index Web Page"}
                </button>

                {/* Suggestions Pills */}
                <div style={{ marginTop: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: D.muted, display: "block", marginBottom: 8 }}>Quick Suggested Portals:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {suggestions.map(([label, link]) => (
                      <button 
                        key={link} 
                        onClick={() => setUrl(`https://${link}`)}
                        style={{ fontSize: 11, fontWeight: 600, padding: "6px 10px", borderRadius: 100, background: "rgba(255,255,255,0.04)", border: `1px solid ${D.border}`, color: D.text, cursor: "pointer" }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {status && (
              <div style={{ marginTop: 16, borderRadius: 16, padding: "14px 18px", fontSize: 14, background: status.startsWith("✓") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: status.startsWith("✓") ? D.accent : "#ef4444", border: `1px solid ${status.startsWith("✓") ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, display: "flex", alignItems: "center", gap: 10 }}>
                {status.startsWith("✓") ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <span>{status}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ManagedDocument = { id: string; title: string; category: string; file_type: string; status: string; processing_status?: string; source_url?: string | null; storage_path: string; chunk_count?: number; created_at: string; processing_error?: string | null };

function DocumentLibrary() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    const client = supabase;
    setLoading(true);
    const { data: { user } } = await client.auth.getUser();
    const { data: prof } = user ? await client.from("profiles").select("role").eq("id", user.id).single() : { data: null };
    const { data: roles } = user ? await client.from("user_roles").select("role").eq("user_id", user.id) : { data: null };
    const isSuperAdmin = prof?.role === "super_admin" || roles?.some(r => r.role === "super_admin");

    let query = client.from("documents").select("id,title,category,file_type,status,processing_status,source_url,storage_path,chunk_count,created_at,processing_error,uploaded_by").order("created_at", { ascending: false });

    if (!isSuperAdmin && user?.id) {
      query = query.eq("uploaded_by", user.id);
    }

    const { data, error } = await query;
    setDocuments((data ?? []) as ManagedDocument[]);
    setNotice(error ? error.message : "");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = documents.filter(d =>
    (filter === "all" || d.processing_status === filter || d.status === filter) &&
    `${d.title} ${d.category} ${d.source_url ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const archive = async (d: ManagedDocument) => {
    if (!supabase) return;
    const { error } = await supabase.from("documents").update({ status: d.status === "archived" ? "active" : "archived", processing_status: d.status === "archived" ? "ready" : "archived" }).eq("id", d.id);
    setNotice(error ? error.message : `${d.title} ${d.status === "archived" ? "restored" : "archived"}.`);
    load();
  };

  const remove = async (d: ManagedDocument) => {
    if (!supabase || !confirm(`Delete ${d.title}?`)) return;
    const { error } = await supabase.from("documents").delete().eq("id", d.id);
    if (!error) await supabase.storage.from("documents").remove([d.storage_path]);
    setNotice(error ? error.message : `${d.title} deleted.`);
    load();
  };

  const statusColor = (d: ManagedDocument) => {
    if (d.status === "archived") return { bg: "#3a3a3a", text: D.muted };
    if (d.processing_status === "ready") return { bg: "rgba(16,185,129,0.15)", text: D.accent, border: "rgba(16,185,129,0.3)" };
    if (d.processing_status === "failed") return { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "rgba(239,68,68,0.3)" };
    return { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" };
  };

  return (
    <section style={{ borderRadius: 24, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: D.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Folder size={20} style={{ color: D.accent }} />
            Knowledge Base Documents
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 100, background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, color: D.muted }}>
              {visible.length} items
            </span>
          </h2>
          <p style={{ marginTop: 4, fontSize: 14, color: D.muted }}>Review, manage, archive or remove documents indexed for RAG retrieval.</p>
        </div>

        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 100, border: `1px solid ${D.border}`, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: D.muted, background: "rgba(255,255,255,0.03)", cursor: "pointer" }}>
          <RefreshCw size={14} /> Refresh List
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <label style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 10, borderRadius: 16, border: `1px solid ${D.border}`, padding: "10px 16px", background: "rgba(0,0,0,0.2)" }}>
          <Search size={16} style={{ color: D.muted, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: D.text }} placeholder="Search title, category or URL..." />
        </label>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {["all", "ready", "processing", "failed", "archived"].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              style={{
                padding: "8px 14px", borderRadius: 100, fontSize: 12, fontWeight: filter === st ? 800 : 500,
                textTransform: "capitalize",
                background: filter === st ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.03)",
                color: filter === st ? D.accent : D.muted,
                border: filter === st ? "1px solid rgba(16,185,129,0.3)" : `1px solid ${D.border}`,
                cursor: "pointer", transition: "all 0.15s"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p style={{ marginBottom: 20, borderRadius: 14, padding: "12px 16px", fontSize: 13, background: notice.includes("deleted") || notice.includes("archived") || notice.includes("restored") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: notice.includes("deleted") || notice.includes("archived") || notice.includes("restored") ? D.accent : "#ef4444" }}>{notice}</p>
      )}

      {/* Mobile-Friendly Curved Card View */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: D.muted, fontSize: 14 }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            Loading knowledge documents...
          </div>
        ) : visible.length ? (
          visible.map(d => {
            const sc = statusColor(d);
            const isExpanded = expandedId === d.id;
            return (
              <div 
                key={d.id} 
                style={{ 
                  borderRadius: 20, 
                  background: "rgba(255,255,255,0.02)", 
                  border: `1px solid ${D.border}`, 
                  padding: 20, 
                  transition: "all 0.2s" 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 240 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "grid", placeItems: "center", color: D.accent, flexShrink: 0 }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <b style={{ fontSize: 15, color: D.text, display: "block", marginBottom: 4 }}>{d.title}</b>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: D.muted, textTransform: "uppercase" }}>
                          {d.file_type}
                        </span>
                        <span style={{ fontSize: 12, color: D.muted }}>
                          {d.category} · {new Date(d.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: sc.bg, color: sc.text, border: sc.border ? `1px solid ${sc.border}` : "none" }}>
                          {d.status === "archived" ? "Archived" : d.processing_status ?? "Uploaded"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High Visibility Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}
                      style={{ borderRadius: 12, border: `1px solid ${D.border}`, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: D.muted, background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Eye size={14} />
                      <span>{isExpanded ? "Hide" : "Details"}</span>
                    </button>
                    <button 
                      onClick={() => archive(d)} 
                      style={{ 
                        borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", 
                        padding: "8px 14px", fontSize: 12, fontWeight: 700, 
                        color: d.status === "archived" ? D.accent : D.text, 
                        background: d.status === "archived" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", 
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6 
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>{d.status === "archived" ? "Restore" : "Archive"}</span>
                    </button>
                    <button 
                      onClick={() => remove(d)} 
                      style={{ 
                        borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", 
                        padding: "8px 14px", fontSize: 12, fontWeight: 700, 
                        color: "#f87171", background: "rgba(239,68,68,0.1)", 
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6 
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Document Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${D.border}` }}
                    >
                      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", fontSize: 12 }}>
                        <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 12, border: `1px solid ${D.border}` }}>
                          <span style={{ color: D.muted, display: "block", marginBottom: 2, fontWeight: 700 }}>Source URL / Path</span>
                          <span style={{ color: D.text, wordBreak: "break-all" }}>{d.source_url || d.storage_path}</span>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 12, border: `1px solid ${D.border}` }}>
                          <span style={{ color: D.muted, display: "block", marginBottom: 2, fontWeight: 700 }}>RAG Embeddings</span>
                          <span style={{ color: D.accent, fontWeight: 800 }}>{d.chunk_count ?? 0} vectorized chunks</span>
                        </div>
                      </div>
                      {d.processing_error && (
                        <div style={{ marginTop: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: 10, borderRadius: 12, color: "#f87171", fontSize: 12 }}>
                          <b>Error Trace:</b> {d.processing_error}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 48, textAlign: "center", color: D.muted, fontSize: 14 }}>
            No documents found matching this filter.
          </div>
        )}
      </div>
    </section>
  );
}

// ── Upload Document Modal ──────────────────────────────────────────────────
function UploadDocumentModal({ onClose }: { onClose: () => void }) {
  const [activeMode, setActiveMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("https://www.dkut.ac.ke/");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!supabase) return;
    if (activeMode === "file") {
      if (!file) return;
      setBusy(true); setStatus("Uploading file to storage...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setBusy(false); setStatus("Session expired. Sign in again."); return; }
      const { data: profile } = await supabase.from("profiles").select("institution_id").eq("id", user.id).single();
      const ext = file.name.split(".").pop()?.toLowerCase() || "file";
      const path = `admin/${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: se } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (se) { setBusy(false); setStatus(se.message); return; }
      
      setStatus("Creating document record...");
      const { data: doc, error: de } = await supabase.from("documents").insert({ 
        title: file.name.replace(/\.[^.]+$/, ""), 
        category: "Administration", 
        storage_path: path, 
        file_type: ext, 
        uploaded_by: user.id, 
        institution_id: profile?.institution_id || "00000000-0000-0000-0000-000000000001", 
        metadata: { processing_status: ext === "txt" ? "processing" : "uploaded_pending_extraction", original_name: file.name } 
      }).select("id,title").single();
      
      if (de) { setBusy(false); setStatus(de.message); return; }
      
      if (ext === "txt") {
        setStatus("Indexing text into AI vector DB...");
        const text = await file.text();
        const { data, error } = await supabase.functions.invoke("ingest-document", { body: { documentId: doc.id, text } });
        setStatus(error ? `Uploaded but indexing failed: ${error.message}` : `✓ "${doc.title}" indexed into ${data?.chunks || 0} chunks!`);
      } else {
        setStatus(`Extracting text from ${ext.toUpperCase()}...`);
        const { data, error } = await supabase.functions.invoke("process-document", { body: { documentId: doc.id, storagePath: path, extension: ext } });
        setStatus(error ? `Extraction failed: ${error.message}` : `✓ "${doc.title}" indexed into ${data?.chunks || 0} chunks!`);
      }
      setBusy(false);
      setTimeout(() => onClose(), 1500);
    } else {
      if (!url.trim()) return;
      setBusy(true); setStatus("Fetching official webpage...");
      const result = await scrapeDeKut(url);
      if (result.error) { setBusy(false); setStatus(`Scrape failed: ${result.error}`); return; }
      
      setStatus("Saving web document record...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setBusy(false); setStatus("Session expired."); return; }
      const { data: profile } = await supabase.from("profiles").select("institution_id").eq("id", user.id).single();
      const path = `admin/${user.id}/${crypto.randomUUID()}.txt`;
      
      const { error: se } = await supabase.storage.from("documents").upload(path, result.text || "", { contentType: "text/plain" });
      if (se) { setBusy(false); setStatus(se.message); return; }
      
      const { data: doc, error: de } = await supabase.from("documents").insert({ 
        title: result.title || "Scraped Webpage", 
        category: "Administration", 
        source_url: url, 
        storage_path: path, 
        file_type: "txt", 
        uploaded_by: user.id, 
        institution_id: profile?.institution_id || "00000000-0000-0000-0000-000000000001", 
        metadata: { processing_status: "processing" } 
      }).select("id").single();
      
      if (de) { setBusy(false); setStatus(de.message); return; }
      
      setStatus("Generating vector embeddings...");
      const { error } = await supabase.functions.invoke("ingest-document", { body: { documentId: doc.id, text: result.text } });
      setBusy(false);
      setStatus(error ? `Scraped but indexing failed: ${error.message}` : `✓ "${result.title}" scraped and indexed!`);
      setTimeout(() => onClose(), 1500);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", padding: 16 }}>
      <motion.section 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ width: "100%", maxWidth: 520, borderRadius: 24, background: "rgba(10, 16, 24, 0.95)", padding: 28, border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "grid", placeItems: "center", color: D.accent }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: D.text }}>Upload Document to AI</h2>
              <p style={{ fontSize: 12, color: D.muted }}>Ingest handbook, schedule, or webpage into knowledge base.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} style={{ color: D.muted, background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, borderRadius: 10, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>

        {/* Mode Switch */}
        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.03)", padding: 4, borderRadius: 14, border: `1px solid ${D.border}`, marginBottom: 20 }}>
          <button 
            onClick={() => setActiveMode("file")} 
            style={{ flex: 1, padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: activeMode === "file" ? D.accent : "transparent", color: activeMode === "file" ? "#000" : D.muted, transition: "all 0.2s" }}
          >
            File Upload
          </button>
          <button 
            onClick={() => setActiveMode("url")} 
            style={{ flex: 1, padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: activeMode === "url" ? "#3b82f6" : "transparent", color: activeMode === "url" ? "#fff" : D.muted, transition: "all 0.2s" }}
          >
            Webpage URL
          </button>
        </div>

        {activeMode === "file" ? (
          <div>
            <div style={{ borderRadius: 18, border: `2px dashed ${file ? D.accent : "rgba(255,255,255,0.15)"}`, background: file ? "rgba(16,185,129,0.05)" : "rgba(0,0,0,0.3)", padding: 24, textAlign: "center", transition: "all 0.2s" }}>
              <UploadCloud size={36} style={{ color: file ? D.accent : D.muted, margin: "0 auto 12px" }} />
              <label style={{ cursor: "pointer", display: "block" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: D.text, display: "block" }}>
                  {file ? file.name : "Choose or drag a document file"}
                </span>
                <span style={{ fontSize: 12, color: D.muted, marginTop: 4, display: "block" }}>
                  Supports PDF, DOCX, TXT, Images (Max 25MB)
                </span>
                <input onChange={e => setFile(e.target.files?.[0] ?? null)} accept=".pdf,.docx,.txt,image/*" type="file" style={{ display: "none" }} />
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: D.muted, marginBottom: 8 }}>
              OFFICIAL TARGET URL
            </label>
            <input 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              style={{ width: "100%", borderRadius: 14, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.4)", color: D.text, padding: "12px 14px", fontSize: 13, outline: "none" }}
              placeholder="https://www.dkut.ac.ke/..."
            />
          </div>
        )}

        {status && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: status.startsWith("✓") ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${status.startsWith("✓") ? "rgba(16,185,129,0.3)" : D.border}`, fontSize: 13, color: status.startsWith("✓") ? D.accent : D.text, fontWeight: 600 }}>
            {status}
          </div>
        )}

        <button 
          disabled={busy || (activeMode === "file" && !file) || (activeMode === "url" && !url.trim())} 
          onClick={handleUpload} 
          style={{ 
            width: "100%", marginTop: 20, borderRadius: 16, 
            background: busy || (activeMode === "file" && !file) || (activeMode === "url" && !url.trim()) ? "rgba(255,255,255,0.05)" : activeMode === "file" ? "linear-gradient(135deg, #10b981, #059669)" : "#3b82f6", 
            padding: "14px 20px", fontSize: 14, fontWeight: 800, 
            color: busy || (activeMode === "file" && !file) || (activeMode === "url" && !url.trim()) ? D.muted : "#000", 
            cursor: busy || (activeMode === "file" && !file) || (activeMode === "url" && !url.trim()) ? "not-allowed" : "pointer", border: "none", 
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}
        >
          <Upload size={18} />
          {busy ? "Processing..." : activeMode === "file" ? (file ? `Confirm & Upload ${file.name.slice(0, 18)}...` : "Select File to Upload") : "Scrape & Index Webpage"}
        </button>
      </motion.section>
    </div>
  );
}

// ── Edit Notice Modal ─────────────────────────────────────────────────────────
function EditNoticeModal({ notice, onClose, onUpdated }: { notice: any; onClose: () => void; onUpdated: (updated: any) => void }) {
  const [title, setTitle] = useState(notice.title || "");
  const [category, setCategory] = useState(notice.category || "General");
  const [body, setBody] = useState(notice.body || notice.summary || "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const save = async () => {
    if (!supabase || !title.trim() || !body.trim()) return;
    setBusy(true);
    setStatus("Saving changes...");
    
    const { data, error } = await supabase.from("notices").update({
      title,
      category,
      body,
      summary: body.substring(0, 100),
    }).eq("id", notice.id).select("*").single();

    setBusy(false);
    if (error) {
      setStatus(`Failed: ${error.message}`);
    } else {
      setStatus("✓ Notice updated successfully!");
      onUpdated(data);
      setTimeout(() => onClose(), 800);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", padding: 16 }}>
      <section style={{ width: "100%", maxWidth: 500, borderRadius: 24, background: "rgba(10, 16, 24, 0.95)", padding: 28, border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "grid", placeItems: "center", color: D.accent }}>
              <Pencil size={18} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: D.text }}>Edit Campus Notice</h2>
          </div>
          <button onClick={onClose} disabled={busy} style={{ color: D.muted, background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, borderRadius: 10, cursor: "pointer", padding: 6 }}><X size={18} /></button>
        </div>

        <label style={{ display: "block", marginTop: 20, fontSize: 12, fontWeight: 700, color: D.muted }}>
          TITLE
          <input value={title} onChange={e=>setTitle(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.4)", color: D.text, padding: "12px 14px", fontSize: 14, outline: "none" }} placeholder="Notice title" />
        </label>

        <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 700, color: D.muted }}>
          CATEGORY
          <select value={category} onChange={e=>setCategory(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.4)", color: D.text, padding: "12px 14px", fontSize: 14, outline: "none" }}>
            <option value="General">General Notice</option>
            <option value="Academics">Academics</option>
            <option value="Finance">Finance & Fees</option>
            <option value="Events">Events & Activities</option>
            <option value="Administration">Administration</option>
          </select>
        </label>

        <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 700, color: D.muted }}>
          NOTICE BODY
          <textarea value={body} onChange={e=>setBody(e.target.value)} disabled={busy} rows={6} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.4)", color: D.text, padding: "12px 14px", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.5 }} placeholder="Full notice content..." />
        </label>

        {status && (
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 12, background: status.startsWith("✓") ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${status.startsWith("✓") ? "rgba(16,185,129,0.3)" : D.border}`, fontSize: 13, color: status.startsWith("✓") ? D.accent : D.text, fontWeight: 600 }}>
            {status}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={onClose} disabled={busy} style={{ flex: 1, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, padding: "12px 0", fontSize: 14, fontWeight: 700, color: D.text, cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={busy || !title.trim() || !body.trim()} style={{ flex: 1, borderRadius: 14, background: D.accent, padding: "12px 0", fontSize: 14, fontWeight: 800, color: "#000", cursor: busy ? "not-allowed" : "pointer", border: "none" }}>Save Changes</button>
        </div>
      </section>
    </div>
  );
}

// ── Compose modal ─────────────────────────────────────────────────────────
function Compose({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const save = async () => {
    if(!supabase || !title.trim() || !body.trim()) return;
    setBusy(true);
    setStatus("Publishing notice...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("Session expired."); setBusy(false); return; }

    const { data: profile } = await supabase.from("profiles").select("institution_id").eq("id", user.id).single();
    
    const { data, error } = await supabase.from("notices").insert({
      title,
      body,
      summary: body.substring(0, 100),
      author_id: user.id,
      institution_id: profile?.institution_id || "00000000-0000-0000-0000-000000000001",
      category: "General"
    }).select("id").single();
    
    if (error) {
      setBusy(false);
      setStatus(error.message);
      return;
    }

    if (data) {
      supabase.functions.invoke("send-push", {
        body: { recipientId: "all", title: "New Campus Notice", body: title, url: "/portal/student", tag: `notice-${data.id}` }
      });
    }
    setBusy(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.7)", padding: 16 }}>
      <section style={{ width: "100%", maxWidth: 460, borderRadius: 14, background: D.card, padding: 28, border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: D.text }}>Create a Notice</h2>
          <button onClick={onClose} disabled={busy} style={{ color: D.muted, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <label style={{ display: "block", marginTop: 20, fontSize: 12, fontWeight: 700, color: D.muted }}>
          TITLE
          <input value={title} onChange={e=>setTitle(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 8, border: `1px solid ${D.border}`, background: D.bg, color: D.text, padding: "10px 12px", fontSize: 13, outline: "none" }} placeholder="Add a clear title"
            onFocus={e => (e.currentTarget.style.borderColor = "#525252")}
            onBlur={e => (e.currentTarget.style.borderColor = D.border)} />
        </label>
        <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 700, color: D.muted }}>
          MESSAGE
          <textarea value={body} onChange={e=>setBody(e.target.value)} disabled={busy} rows={5} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 8, border: `1px solid ${D.border}`, background: D.bg, color: D.text, padding: "10px 12px", fontSize: 13, outline: "none", resize: "vertical" }} placeholder="Type the notice..."
            onFocus={e => (e.currentTarget.style.borderColor = "#525252")}
            onBlur={e => (e.currentTarget.style.borderColor = D.border)} />
        </label>
        <button onClick={save} style={{ marginTop: 20, width: "100%", borderRadius: 8, background: D.accent, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#000", cursor: "pointer", border: "none" }}>Publish Notice</button>
      </section>
    </div>
  );
}

// ── INSTITUTION MODALS & WORKSPACE (SUPER ADMIN ONLY) ──────────────────────────

function ContactInstitutionModal({ inst, onClose, onSent }: { inst: any; onClose: () => void; onSent: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const sendDirective = async () => {
    if (!title.trim() || !body.trim()) { setStatus("Please fill title and message body."); return; }
    if (!supabase) return;
    setBusy(true);
    setStatus("Sending administrative notice...");
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("notices").insert({
      title: `[SUPERADMIN DIRECTIVE] ${title}`,
      body,
      summary: body.substring(0, 100),
      author_id: user?.id,
      institution_id: inst.id,
      category: "Administrative Directive"
    }).select("id").single();

    if (error) {
      setStatus(`Error: ${error.message}`);
      setBusy(false);
      return;
    }

    if (data) {
      supabase.functions.invoke("send-push", {
        body: { recipientId: "all", title: `Superadmin Notice: ${title}`, body, url: "/portal/student", tag: `notice-${data.id}` }
      });
    }

    setBusy(false);
    onSent();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 16 }}>
      <section style={{ width: "100%", maxWidth: 500, borderRadius: 24, background: "#0c131d", padding: 28, border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${D.border}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(16,185,129,0.15)", display: "grid", placeItems: "center", color: D.accent }}>
              <MessageSquareText size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text }}>Message Institution</h2>
              <p style={{ fontSize: 12, color: D.muted }}>{inst.name} ({inst.domain})</p>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} style={{ color: D.muted, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, cursor: "pointer", padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {status && <div style={{ marginTop: 12, fontSize: 12, color: status.startsWith("Error") ? "#ef4444" : D.accent }}>{status}</div>}

        <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 700, color: D.muted }}>
          SUBJECT / TITLE
          <input value={title} onChange={e=>setTitle(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }} placeholder="e.g. System Maintenance Notice or Compliance Review" />
        </label>

        <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 700, color: D.muted }}>
          DIRECTIVE MESSAGE
          <textarea value={body} onChange={e=>setBody(e.target.value)} disabled={busy} rows={5} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none", resize: "vertical" }} placeholder="Type administrative directive to publish to institution workspace..." />
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} disabled={busy} style={{ flex: 1, borderRadius: 12, border: `1px solid ${D.border}`, background: "transparent", color: D.muted, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={sendDirective} disabled={busy} style={{ flex: 1, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", padding: "12px 0", fontSize: 13, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Send size={16} /> Send Directive
          </button>
        </div>
      </section>
    </div>
  );
}

function AddInstitutionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [themeColor, setThemeColor] = useState("#10b981");
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !domain.trim()) { setError("Name and Domain are required."); return; }
    if (!supabase) return;
    setBusy(true);
    setError("");

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const { error: insertError } = await supabase.from("institutions").insert({
      name: name.trim(),
      domain: cleanDomain,
      theme_color: themeColor,
      contact_email: contactEmail.trim() || null,
      status: "active"
    });

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      onCreated();
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 16 }}>
      <section style={{ width: "100%", maxWidth: 480, borderRadius: 24, background: "#0c131d", padding: 28, border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${D.border}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(16,185,129,0.15)", display: "grid", placeItems: "center", color: D.accent }}>
              <Building2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text }}>Add New Institution</h2>
              <p style={{ fontSize: 12, color: D.muted }}>Register a new campus tenant on KiliGuide</p>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} style={{ color: D.muted, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, cursor: "pointer", padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12, color: "#ef4444" }}>{error}</div>}

        <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 700, color: D.muted }}>
          INSTITUTION NAME
          <input value={name} onChange={e=>setName(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }} placeholder="e.g. University of Nairobi" />
        </label>

        <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 700, color: D.muted }}>
          DOMAIN (e.g. uonbi.ac.ke)
          <input value={domain} onChange={e=>setDomain(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }} placeholder="uonbi.ac.ke" />
        </label>

        <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 700, color: D.muted }}>
          ADMIN CONTACT EMAIL
          <input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }} placeholder="admin@uonbi.ac.ke" />
        </label>

        <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 700, color: D.muted }}>
          BRAND THEME COLOR
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <input type="color" value={themeColor} onChange={e=>setThemeColor(e.target.value)} disabled={busy} style={{ width: 40, height: 38, borderRadius: 8, border: "none", cursor: "pointer", background: "transparent" }} />
            <input value={themeColor} onChange={e=>setThemeColor(e.target.value)} disabled={busy} style={{ flex: 1, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "8px 12px", fontSize: 13, outline: "none" }} />
          </div>
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} disabled={busy} style={{ flex: 1, borderRadius: 12, border: `1px solid ${D.border}`, background: "transparent", color: D.muted, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleCreate} disabled={busy} style={{ flex: 1, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", padding: "12px 0", fontSize: 13, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={16} /> Create Institution
          </button>
        </div>
      </section>
    </div>
  );
}

function EditInstitutionModal({ inst, onClose, onUpdated }: { inst: any; onClose: () => void; onUpdated: () => void }) {
  const [name, setName] = useState(inst.name || "");
  const [domain, setDomain] = useState(inst.domain || "");
  const [contactEmail, setContactEmail] = useState(inst.contact_email || "");
  const [status, setStatus] = useState(inst.status || "active");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !domain.trim()) { setError("Name and Domain are required."); return; }
    if (!supabase) return;
    setBusy(true);
    setError("");

    const { error: updateError } = await supabase.from("institutions").update({
      name: name.trim(),
      domain: domain.toLowerCase().trim(),
      contact_email: contactEmail.trim() || null,
      status
    }).eq("id", inst.id);

    setBusy(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      onUpdated();
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: 16 }}>
      <section style={{ width: "100%", maxWidth: 480, borderRadius: 24, background: "#0c131d", padding: 28, border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${D.border}`, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(16,185,129,0.15)", display: "grid", placeItems: "center", color: D.accent }}>
              <Pencil size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text }}>Edit Institution</h2>
              <p style={{ fontSize: 12, color: D.muted }}>Update details for {inst.name}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={busy} style={{ color: D.muted, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, cursor: "pointer", padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12, color: "#ef4444" }}>{error}</div>}

        <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 700, color: D.muted }}>
          INSTITUTION NAME
          <input value={name} onChange={e=>setName(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }} />
        </label>

        <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 700, color: D.muted }}>
          DOMAIN
          <input value={domain} onChange={e=>setDomain(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }} />
        </label>

        <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 700, color: D.muted }}>
          CONTACT EMAIL
          <input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }} />
        </label>

        <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 700, color: D.muted }}>
          STATUS
          <select value={status} onChange={e=>setStatus(e.target.value)} disabled={busy} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 12, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: D.text, padding: "10px 14px", fontSize: 13, outline: "none" }}>
            <option value="active" style={{ background: "#111" }}>Active (Approved)</option>
            <option value="suspended" style={{ background: "#111" }}>Suspended (Inapproved)</option>
            <option value="pending" style={{ background: "#111" }}>Pending</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} disabled={busy} style={{ flex: 1, borderRadius: 12, border: `1px solid ${D.border}`, background: "transparent", color: D.muted, padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={busy} style={{ flex: 1, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", padding: "12px 0", fontSize: 13, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
            Save Changes
          </button>
        </div>
      </section>
    </div>
  );
}

function InstitutionsWorkspace() {
  const [requests, setRequests] = useState<any[]>([]);
  const [approvedList, setApprovedList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [showDocuments, setShowDocuments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "suspended">("all");

  const [contactInst, setContactInst] = useState<any | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [editInst, setEditInst] = useState<any | null>(null);

  const load = async () => {
    if (!supabase) return;
    setBusy(true);
    const [reqRes, instRes, settingsRes] = await Promise.all([
      supabase.from("institution_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("institutions").select("*").order("name", { ascending: true }),
      supabase.from("system_settings").select("*").in("key", ["allow_institution_registration", "show_documents_to_users"])
    ]);
    setRequests(reqRes.data || []);
    setApprovedList(instRes.data || []);

    if (settingsRes.data) {
      const reg = settingsRes.data.find(s => s.key === "allow_institution_registration");
      if (reg) setAllowRegistration(reg.value === 'true');
      const doc = settingsRes.data.find(s => s.key === "show_documents_to_users");
      if (doc) setShowDocuments(doc.value === 'true');
    }
    setBusy(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRegistration = async () => {
    if (!supabase) return;
    const newValue = !allowRegistration;
    setAllowRegistration(newValue);
    await supabase.from("system_settings").upsert({ key: "allow_institution_registration", value: newValue ? 'true' : 'false' });
  };

  const toggleDocuments = async () => {
    if (!supabase) return;
    const newValue = !showDocuments;
    setShowDocuments(newValue);
    await supabase.from("system_settings").upsert({ key: "show_documents_to_users", value: newValue ? 'true' : 'false' });
  };

  const handleApprove = async (id: string, name: string) => {
    if (!supabase || !confirm(`Approve institution "${name}"? This will elevate the requester to Institution Administrator.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("approve_institution", { req_id: id });
    setBusy(false);
    if (error) alert("Error approving: " + error.message);
    else load();
  };

  const handleReject = async (id: string, name: string) => {
    if (!supabase || !confirm(`Reject institution "${name}"?`)) return;
    const reason = prompt("Reason for rejection:");
    if (reason === null) return;
    setBusy(true);
    const { error } = await supabase.rpc("reject_institution", { req_id: id, reason });
    setBusy(false);
    if (error) alert("Error rejecting: " + error.message);
    else load();
  };

  const handleToggleStatus = async (inst: any) => {
    if (!supabase) return;
    const isSuspended = inst.status === "suspended";
    const nextStatus = isSuspended ? "active" : "suspended";
    const actionName = isSuspended ? "Re-activate" : "Inapprove / Suspend";
    if (!confirm(`${actionName} institution "${inst.name}"?`)) return;

    setBusy(true);
    const { error } = await supabase.from("institutions").update({ status: nextStatus }).eq("id", inst.id);
    setBusy(false);
    if (error) alert(`Error updating status: ${error.message}`);
    else load();
  };

  const handleDeleteInstitution = async (inst: any) => {
    if (!supabase) return;
    if (inst.id === '00000000-0000-0000-0000-000000000001') {
      alert("Cannot delete the default root system institution.");
      return;
    }
    if (!confirm(`Are you sure you want to DELETE institution "${inst.name}"?\n\nThis will remove all associated tenant notices, documents, and re-assign members to default.`)) return;

    setBusy(true);
    const { error: rpcError } = await supabase.rpc("delete_institution", { inst_id: inst.id });
    if (rpcError) {
      console.warn("RPC delete_institution error, attempting direct delete:", rpcError);
      const { error: directError } = await supabase.from("institutions").delete().eq("id", inst.id);
      if (directError) alert(`Error deleting institution: ${directError.message}`);
    }
    setBusy(false);
    load();
  };

  const filteredInstitutions = useMemo(() => {
    return approvedList.filter(inst => {
      const matchSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inst.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const instStatus = inst.status || "active";
      if (filterTab === "active") return matchSearch && instStatus === "active";
      if (filterTab === "suspended") return matchSearch && instStatus === "suspended";
      return matchSearch;
    });
  }, [approvedList, searchQuery, filterTab]);

  const activeCount = approvedList.filter(i => (i.status || "active") === "active").length;
  const suspendedCount = approvedList.filter(i => i.status === "suspended").length;
  const pendingRequestsCount = requests.filter(r => r.status === "pending").length;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Action Header Bar */}
      <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 size={24} style={{ color: D.accent }} />
              Multi-Tenant Institution Management
            </h2>
            <p style={{ marginTop: 4, fontSize: 13, color: D.muted }}>Approve onboarding, suspend/activate accounts, communicate directly, or delete institution tenants.</p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setAddModal(true)}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#000", padding: "10px 18px", borderRadius: 14,
                fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
              }}
            >
              <Plus size={18} /> Add Institution
            </button>
          </div>
        </div>

        {/* Global Controls & Feature Toggles */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <Settings size={16} style={{ color: D.accent }} /> Platform Controls
          </span>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "rgba(0,0,0,0.2)", padding: "8px 14px", borderRadius: 100, border: `1px solid ${D.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: D.text }}>Show Documents Tab</span>
              <div 
                onClick={toggleDocuments}
                style={{ width: 40, height: 22, borderRadius: 11, background: showDocuments ? D.accent : "#3a3a3a", position: "relative", transition: "all 0.2s" }}
              >
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: showDocuments ? 20 : 2, transition: "all 0.2s" }} />
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "rgba(0,0,0,0.2)", padding: "8px 14px", borderRadius: 100, border: `1px solid ${D.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: D.text }}>Allow New Institutions</span>
              <div 
                onClick={toggleRegistration}
                style={{ width: 40, height: 22, borderRadius: 11, background: allowRegistration ? D.accent : "#3a3a3a", position: "relative", transition: "all 0.2s" }}
              >
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: allowRegistration ? 20 : 2, transition: "all 0.2s" }} />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Analytics & Metrics Header Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: D.muted }}>TOTAL TENANTS</span>
            <Building2 size={18} style={{ color: D.accent }} />
          </div>
          <b style={{ fontSize: 24, fontWeight: 800, color: D.text, marginTop: 8, display: "block" }}>{approvedList.length}</b>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: D.muted }}>ACTIVE INSTITUTIONS</span>
            <ShieldCheck size={18} style={{ color: D.accent }} />
          </div>
          <b style={{ fontSize: 24, fontWeight: 800, color: D.accent, marginTop: 8, display: "block" }}>{activeCount}</b>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: D.muted }}>SUSPENDED / INAPPROVED</span>
            <XCircle size={18} style={{ color: "#ef4444" }} />
          </div>
          <b style={{ fontSize: 24, fontWeight: 800, color: suspendedCount > 0 ? "#ef4444" : D.text, marginTop: 8, display: "block" }}>{suspendedCount}</b>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: D.muted }}>PENDING REQUESTS</span>
            <Clock size={18} style={{ color: "#f59e0b" }} />
          </div>
          <b style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b", marginTop: 8, display: "block" }}>{pendingRequestsCount}</b>
        </div>
      </div>

      {/* Pending Onboarding Requests Section */}
      {requests.length > 0 && (
        <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}` }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: D.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            Pending Institution Onboarding Requests
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 100, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
              {pendingRequestsCount} pending
            </span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map(r => (
              <div 
                key={r.id}
                style={{ 
                  borderRadius: 20, 
                  background: "rgba(0,0,0,0.2)", 
                  border: `1px solid ${D.border}`, 
                  padding: 18,
                  display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16
                }}
              >
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <b style={{ fontSize: 15, color: D.text }}>{r.name}</b>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
                      {r.domain}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: D.muted, display: "block" }}>
                    Admin: <strong style={{ color: D.text }}>{r.admin_name}</strong> ({r.admin_email})
                  </span>
                  {r.notes && (
                    <p style={{ fontSize: 12, color: D.muted, marginTop: 6, background: "rgba(0,0,0,0.3)", padding: 8, borderRadius: 10 }}>
                      Notes: {r.notes}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 800, background: r.status === "approved" ? "rgba(16,185,129,0.15)" : r.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: r.status === "approved" ? D.accent : r.status === "rejected" ? "#ef4444" : "#f59e0b", textTransform: "uppercase" }}>
                    {r.status}
                  </span>

                  {r.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button disabled={busy} onClick={() => handleApprove(r.id, r.name)} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#000", padding: "8px 16px", borderRadius: 12, cursor: busy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 800, border: "none", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>Approve</button>
                      <button disabled={busy} onClick={() => handleReject(r.id, r.name)} style={{ background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, color: "#ef4444", padding: "8px 16px", borderRadius: 12, cursor: busy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Registered Institutions Directory */}
      <div style={{ borderRadius: 24, background: "rgba(255,255,255,0.02)", padding: 24, border: `1px solid ${D.border}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: D.text, display: "flex", alignItems: "center", gap: 8 }}>
            Registered Campus Institutions Directory
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 100, background: "rgba(16,185,129,0.15)", color: D.accent }}>
              {filteredInstitutions.length} listed
            </span>
          </h3>

          {/* Search & Filter controls */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", minWidth: 220 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: D.muted }} />
              <input
                value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)}
                placeholder="Search name or domain..."
                style={{
                  width: "100%", padding: "8px 12px 8px 36px", borderRadius: 12,
                  background: "rgba(0,0,0,0.3)", border: `1px solid ${D.border}`,
                  color: D.text, fontSize: 13, outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: 3, borderRadius: 12, border: `1px solid ${D.border}` }}>
              {(["all", "active", "suspended"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilterTab(t)}
                  style={{
                    padding: "6px 12px", borderRadius: 9, fontSize: 12, fontWeight: filterTab === t ? 800 : 500,
                    background: filterTab === t ? "rgba(16,185,129,0.2)" : "transparent",
                    color: filterTab === t ? D.accent : D.muted, border: "none", cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Institution Cards Grid */}
        {filteredInstitutions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: D.muted, fontSize: 13, background: "rgba(0,0,0,0.2)", borderRadius: 20, border: `1px solid ${D.border}` }}>
            No matching institutions found.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {filteredInstitutions.map(inst => {
              const isSuspended = inst.status === "suspended";
              return (
                <div
                  key={inst.id}
                  style={{
                    borderRadius: 20, background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${isSuspended ? "rgba(239,68,68,0.3)" : D.border}`,
                    padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16,
                    position: "relative", overflow: "hidden"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: isSuspended ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                            border: `1px solid ${isSuspended ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                            display: "grid", placeItems: "center",
                            color: isSuspended ? "#ef4444" : D.accent, flexShrink: 0
                          }}
                        >
                          <Building2 size={22} />
                        </div>
                        <div>
                          <b style={{ fontSize: 15, color: D.text, display: "block" }}>{inst.name}</b>
                          <small style={{ color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>{inst.domain}</small>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 100,
                          background: isSuspended ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                          color: isSuspended ? "#ef4444" : D.accent,
                          border: `1px solid ${isSuspended ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                          textTransform: "uppercase", letterSpacing: "0.05em"
                        }}
                      >
                        {isSuspended ? "SUSPENDED" : "ACTIVE"}
                      </span>
                    </div>

                    {inst.contact_email && (
                      <p style={{ fontSize: 12, color: D.muted, marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={14} style={{ color: D.accent }} /> {inst.contact_email}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar for Superadmin */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingTop: 14, borderTop: `1px solid ${D.border}` }}>
                    {/* Send Directive Notice */}
                    <button
                      onClick={() => setContactInst(inst)}
                      title="Send administrative directive message to institution"
                      style={{
                        flex: 1, minWidth: 100, background: "rgba(59,130,246,0.12)", color: "#60a5fa",
                        border: "1px solid rgba(59,130,246,0.25)", padding: "8px 12px", borderRadius: 12,
                        fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                      }}
                    >
                      <MessageSquareText size={14} /> Message
                    </button>

                    {/* Suspend / Activate Toggle */}
                    <button
                      onClick={() => handleToggleStatus(inst)}
                      title={isSuspended ? "Re-activate Institution" : "Suspend (Inapprove) Institution"}
                      style={{
                        background: isSuspended ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                        color: isSuspended ? D.accent : "#f59e0b",
                        border: `1px solid ${isSuspended ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                        padding: "8px 12px", borderRadius: 12,
                        fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                      }}
                    >
                      {isSuspended ? <ShieldCheck size={14} /> : <XCircle size={14} />}
                      {isSuspended ? "Activate" : "Suspend"}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => setEditInst(inst)}
                      title="Edit Institution details"
                      style={{
                        background: "rgba(255,255,255,0.05)", color: D.muted,
                        border: `1px solid ${D.border}`, padding: "8px 10px", borderRadius: 12,
                        fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center"
                      }}
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteInstitution(inst)}
                      title="Delete Institution"
                      style={{
                        background: "rgba(239,68,68,0.1)", color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)", padding: "8px 10px", borderRadius: 12,
                        fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center"
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Active Modals */}
      {contactInst && (
        <ContactInstitutionModal
          inst={contactInst}
          onClose={() => setContactInst(null)}
          onSent={load}
        />
      )}

      {addModal && (
        <AddInstitutionModal
          onClose={() => setAddModal(false)}
          onCreated={load}
        />
      )}

      {editInst && (
        <EditInstitutionModal
          inst={editInst}
          onClose={() => setEditInst(null)}
          onUpdated={load}
        />
      )}
    </section>
  );
}

// ── WEB CRAWLER ─────────────────────────────────────────────────────────
function WebCrawlerWorkspace() {
  const [crawlStatus, setCrawlStatus] = useState<any>(null);
  const [crawlQueue, setCrawlQueue] = useState<any[]>([]);
  const [crawling, setCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState("");

  const fetchData = async () => {
    if (!supabase) return;
    const [crawlSummaryResult, crawlQueueResult] = await Promise.all([
      supabase.from("crawl_queue").select("status").then(r => r),
      supabase.from("crawl_queue").select("id, url, status, error, last_crawled_at").order("discovered_at", { ascending: false }).limit(50),
    ]);
    setCrawlQueue(crawlQueueResult.data || []);
    const rows = crawlSummaryResult.data || [];
    const summary = { pending: 0, crawling: 0, done: 0, failed: 0, total: rows.length, last_crawled_at: null };
    for (const r of rows) {
      if (r.status === "pending") summary.pending++;
      else if (r.status === "crawling") summary.crawling++;
      else if (r.status === "done") summary.done++;
      else if (r.status === "failed") summary.failed++;
    }
    setCrawlStatus(summary);
  };

  useEffect(() => { fetchData(); }, []);

  const triggerCrawl = async (mode: "discover" | "crawl" | "full") => {
    if (!supabase) return;
    setCrawling(true);
    setCrawlMessage(`Running "${mode}" mode — please wait...`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crawl-sitemap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ mode, max: 20 }),
      });
      const result = await res.json();
      if (res.ok) {
        setCrawlMessage(`✅ ${result.message}`);
        fetchData();
      } else {
        setCrawlMessage(`❌ Error: ${result.error}`);
      }
    } catch (e: any) {
      setCrawlMessage(`❌ Network error: ${e.message}`);
    }
    setCrawling(false);
  };

  return (
    <section>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>

        {/* Discover Card */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "grid", placeItems: "center" }}>
              <Globe size={20} style={{ color: "#60a5fa" }} />
            </div>
            <b style={{ fontSize: 16, color: D.text }}>1. Discover Page URLs</b>
          </div>
          <p style={{ fontSize: 13, color: D.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Fetch official campus sitemap XML and queue all eligible links for crawling.
          </p>
          <button disabled={crawling} onClick={() => triggerCrawl("discover")} style={{ width: "100%", background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)", padding: "14px", borderRadius: 16, fontSize: 14, fontWeight: 800, cursor: crawling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Globe size={18} /> Discover Pages
          </button>
        </div>

        {/* Crawl Pending Card */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(250,204,21,0.15)", display: "grid", placeItems: "center" }}>
              <Zap size={20} style={{ color: "#facc15" }} />
            </div>
            <b style={{ fontSize: 16, color: D.text }}>2. Crawl & Vectorize</b>
          </div>
          <p style={{ fontSize: 13, color: D.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Scrape {crawlStatus?.pending ?? 0} pending URLs, clean text, and generate RAG vector embeddings.
          </p>
          <button disabled={crawling} onClick={() => triggerCrawl("crawl")} style={{ width: "100%", background: "rgba(250,204,21,0.15)", color: "#facc15", border: "1px solid rgba(250,204,21,0.3)", padding: "14px", borderRadius: 16, fontSize: 14, fontWeight: 800, cursor: crawling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Zap size={18} /> Process Queue ({crawlStatus?.pending ?? 0})
          </button>
        </div>
      </div>

      {/* Full Crawl */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 24, padding: 24, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <RefreshCw size={20} style={{ color: "#f87171" }} />
              <b style={{ fontSize: 16, color: D.text }}>Full Crawl (Discover + Process)</b>
            </div>
            <p style={{ fontSize: 13, color: D.muted }}>Discovers new pages from sitemaps AND processes 20 pending URLs automatically in one single execution.</p>
          </div>
          <button disabled={crawling} onClick={() => triggerCrawl("full")} style={{ whiteSpace: "nowrap", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 16, fontSize: 14, fontWeight: 800, cursor: crawling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: crawling ? 0.6 : 1, boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}>
            {crawling ? <><RefreshCw size={16} className="animate-spin" /> Running Crawl...</> : <><RefreshCw size={16} /> Run Full Crawl</>}
          </button>
        </div>
      </div>

      {/* Crawl Log Message */}
      {crawlMessage && (
        <div style={{ background: crawlMessage.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${crawlMessage.startsWith("✅") ? "rgba(16,185,129,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 16, padding: 16, marginBottom: 24, fontSize: 14, color: crawlMessage.startsWith("✅") ? D.accent : "#f87171" }}>
          {crawlMessage}
        </div>
      )}

      {/* Recent Crawl Queue - Curved Responsive Cards */}
      <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16, color: D.text, display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={18} style={{ color: D.accent }} />
        Recent Crawl Queue Log
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {crawlQueue.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 36, textAlign: "center", color: D.muted }}>
            No pages in queue yet. Click "Discover Pages" to populate.
          </div>
        ) : crawlQueue.map(row => (
          <div key={row.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 16, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 240, overflow: "hidden" }}>
              <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, wordBreak: "break-all" }}>
                <span>{row.url}</span>
                <ExternalLink size={12} style={{ flexShrink: 0 }} />
              </a>
              <span style={{ fontSize: 11, color: D.muted, marginTop: 4, display: "block" }}>
                Last crawled: {row.last_crawled_at ? new Date(row.last_crawled_at).toLocaleString() : "Never"}
              </span>
              {row.error && <span title={row.error} style={{ fontSize: 11, color: "#f87171", display: "block", marginTop: 4 }}>⚠ {row.error.slice(0, 100)}</span>}
            </div>

            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 800, textTransform: "uppercase", background: row.status === "done" ? "rgba(16,185,129,0.15)" : row.status === "failed" ? "rgba(239,68,68,0.15)" : row.status === "crawling" ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.05)", color: row.status === "done" ? D.accent : row.status === "failed" ? "#f87171" : row.status === "crawling" ? "#facc15" : D.muted, border: `1px solid ${row.status === "done" ? "rgba(16,185,129,0.3)" : row.status === "failed" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}` }}>
              {row.status === "done" ? <CheckCircle2 size={12} /> : row.status === "failed" ? <XCircle size={12} /> : <Clock size={12} />}
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
