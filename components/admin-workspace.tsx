"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bell, Bot, Check, ChevronDown, ChevronRight,
  FileText, LayoutDashboard, Menu, MessageSquareText, Search,
  ShieldCheck, Ticket, Upload, Users, X, Settings, RefreshCw, Trash2, Archive, CheckCircle2
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { scrapeDeKut } from "../app/actions";

type Tab = "Overview" | "AI Assistant" | "Documents" | "Notices" | "Tickets" | "Users" | "Analytics" | "System Health";
const nav: { label: Tab; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "AI Assistant", icon: MessageSquareText },
  { label: "Documents", icon: FileText },
  { label: "Notices", icon: Bell },
  { label: "Tickets", icon: Ticket },
  { label: "Users", icon: Users },
  { label: "Analytics", icon: BarChart3 },
  { label: "System Health", icon: Settings },
];

const D = {
  bg: "#212121",
  sidebar: "#171717",
  card: "#2a2a2a",
  cardHover: "#303030",
  border: "#2a2a2a",
  muted: "#8e8ea0",
  text: "#ececec",
  accent: "#19c37d",
};

export function AdminWorkspace() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [done, setDone] = useState<number[]>([]);
  const [composer, setComposer] = useState(false);
  
  const [stats, setStats] = useState({ users: 0, docs: 0, tickets: 0, notices: 0, healthScore: 100, chartData: [0,0,0,0,0,0,0] });

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("notices").select("*", { count: "exact", head: true }),
      supabase.from("documents").select("processing_status"),
      supabase.from("messages").select("created_at").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
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
  }, [tab]);

  const go = (next: Tab) => { setTab(next); setMenu(false); };

  return (
    <main style={{ minHeight: "100vh", background: D.bg, color: D.text, display: "flex" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260, flexShrink: 0, background: D.sidebar,
          borderRight: `1px solid ${D.border}`, display: "flex", flexDirection: "column",
          position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50,
          transform: menu ? "translateX(0)" : undefined,
          transition: "transform 0.3s"
        }}
        className={`lg:relative lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${D.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", display: "grid", placeItems: "center", background: D.card, flexShrink: 0 }}>
                <img src="/logo.png" alt="KiliGuide" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.3) translateY(2px)" }} />
              </span>
              <div>
                <strong style={{ fontSize: 15, display: "block", color: D.text }}>KiliGuide</strong>
                <small style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: D.accent }}>ADMINISTRATION</small>
              </div>
            </div>
            <button onClick={() => setMenu(false)} style={{ color: D.muted, padding: 4, background:"transparent", border:"none" }} className="lg:hidden">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: D.muted, padding: "4px 12px 8px" }}>WORKSPACE</p>
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => go(label)}
              style={{
                display: "flex", width: "100%", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: tab === label ? D.card : "transparent",
                color: tab === label ? D.text : D.muted,
                cursor: "pointer", border: "none", transition: "all 0.15s",
                marginBottom: 2
              }}
              onMouseEnter={e => { if (tab !== label) e.currentTarget.style.background = D.card; }}
              onMouseLeave={e => { if (tab !== label) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${D.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#6855e8", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>A</span>
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 13, display: "block", color: D.text }}>Administrator</b>
              <small style={{ fontSize: 11, color: D.muted }}>System Access</small>
            </div>
          </div>
        </div>
      </aside>

      {menu && <button aria-label="Close" onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", border:"none" }} className="lg:hidden" />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="lg:ml-[260px]">
        <header style={{ height: 60, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", borderBottom: `1px solid ${D.border}`, background: D.sidebar, flexShrink: 0, position: "sticky", top: 0, zIndex: 30 }}>
          <button onClick={() => setMenu(true)} style={{ color: D.muted, padding: 6, borderRadius: 8, background:"transparent", border:"none" }} className="lg:hidden">
            <Menu size={20} />
          </button>
          <label style={{ flex: 1, maxWidth: 420, display: "flex", alignItems: "center", gap: 10, borderRadius: 10, background: D.card, padding: "8px 14px", cursor: "text" }}>
            <Search size={16} style={{ color: D.muted, flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: D.text }}
              placeholder="Search in KiliGuide Admin…"
            />
          </label>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 80px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {tab === "Tickets" ? <TicketsWorkspace /> : tab === "Overview" ? (
              <Overview done={done} setDone={setDone} onTab={go} stats={stats} />
            ) : (
              <WorkspaceTab tab={tab} onCompose={() => setComposer(true)} />
            )}
          </div>
        </div>
      </div>

      {composer && <Compose onClose={() => setComposer(false)} />}
    </main>
  );
}

function Metric({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <article style={{ borderRadius: 12, background: D.card, padding: 20, border: `1px solid ${D.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: 10, background: color + "22", display: "grid", placeItems: "center" }}>
          <Icon size={20} style={{ color }} />
        </span>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: D.muted }}>{label}</p>
          <b style={{ fontSize: 22, display: "flex", alignItems: "center", gap: 8 }}>
            {value}
          </b>
        </div>
      </div>
    </article>
  );
}

function Chart({ data = [0,0,0,0,0,0,0] }: { data?: number[] }) {
  const maxVal = Math.max(...data, 10);
  const pts = data.map(v => 180 - (v / maxVal) * 150);
  const xs = [0, 100, 200, 300, 400, 500, 600];
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x} ${pts[i]}`).join(" ");
  return (
    <section style={{ borderRadius: 12, background: D.card, padding: 20, border: `1px solid ${D.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: 15 }}>AI queries over time</h2>
        <button style={{ borderRadius: 8, border: `1px solid ${D.border}`, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: D.muted, background: "transparent" }}>7 days ⌄</button>
      </div>
      <div style={{ position: "relative", marginTop: 20, height: 160 }}>
        <svg viewBox="0 0 600 200" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#19c37d" stopOpacity=".3" />
              <stop offset="1" stopColor="#19c37d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} V200 H0Z`} fill="url(#ga)" />
          <path d={path} fill="none" stroke="#19c37d" strokeWidth="2.5" />
          {xs.map((x, i) => <circle key={x} cx={x} cy={pts[i]} r="4" fill="#19c37d" />)}
        </svg>
      </div>
    </section>
  );
}

function Health({ score = 100 }: { score?: number }) {
  const bars = ["Document processing", "System connectivity", "Vector indexing"];
  return (
    <section style={{ borderRadius: 12, background: D.card, padding: 20, border: `1px solid ${D.border}` }}>
      <h2 style={{ fontWeight: 700, fontSize: 15 }}>Knowledge base health</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20 }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", border: `8px solid ${score >= 90 ? D.accent : "#f59e0b"}`, display: "grid", placeItems: "center", flexShrink: 0, textAlign: "center" }}>
          <div><b style={{ fontSize: 13 }}>{score >= 90 ? "Excellent" : "Needs Review"}</b><br /><span style={{ fontSize: 14, color: score >= 90 ? D.accent : "#f59e0b" }}>{score}/100</span></div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {bars.map((x, i) => (
            <div key={x}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: D.muted }}><span>{x}</span><span>{score}%</span></div>
              <div style={{ height: 4, borderRadius: 2, background: "#3a3a3a", marginTop: 4 }}>
                <div style={{ height: "100%", borderRadius: 2, background: score >= 90 ? D.accent : "#f59e0b", width: `${score}%` }} />
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
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: D.muted }}>Welcome back, <b style={{ color: D.text }}>Admin</b> 👋</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: D.text, letterSpacing: "-0.02em" }}>A healthier, more informed campus.</h1>
        <p style={{ marginTop: 6, color: D.muted, fontSize: 14 }}>Manage people, knowledge and service delivery across the university.</p>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 20 }}>
        <Metric icon={Users} color="#19c37d" value={stats.users.toString()} label="Active users" />
        <Metric icon={FileText} color="#6366f1" value={stats.docs.toString()} label="Live documents" />
        <Metric icon={Ticket} color="#f59e0b" value={stats.tickets.toString()} label="Open tickets" />
        <Metric icon={Bell} color="#ec4899" value={stats.notices.toString()} label="Live notices" />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", marginBottom: 20 }} className="xl:grid-cols-[1fr_1fr] grid-cols-1">
        <Chart data={stats.chartData} />
        <Health score={stats.healthScore} />
      </div>
    </>
  );
}

function WorkspaceTab({ tab, onCompose }: { tab: Tab; onCompose: () => void }) {
  return (
    <section>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: D.accent }}>ADMINISTRATION</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: D.text, letterSpacing: "-0.02em" }}>{tab}</h1>
          <p style={{ marginTop: 6, color: D.muted, fontSize: 14 }}>Manage your university {tab.toLowerCase()} from this workspace.</p>
        </div>
        {["Notices", "Documents"].includes(tab) && (
          <button onClick={onCompose} style={{ borderRadius: 10, background: D.accent, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#000", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", border: "none" }}>
            <Upload size={15} />
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
      ) : tab === "AI Assistant" ? (
        <AILiveFeed />
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

// ── TICKETS ─────────────────────────────────────────────────────────────
function TicketsWorkspace() {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    supabase?.from("tickets").select(`*, created_by(full_name)`).order("created_at", { ascending: false }).then(({ data }) => setTickets(data || []));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    if(!supabase) return;
    await supabase.from("tickets").update({ status }).eq("id", id);
    setTickets(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  };

  return (
    <section style={{ borderRadius: 12, background: D.card, padding: 24, border: `1px solid ${D.border}` }}>
      <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${D.border}` }}>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>SUBJECT</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>AUTHOR</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>STATUS</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "right" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t.id} style={{ borderBottom: `1px solid ${D.border}` }}>
              <td style={{ padding: "14px 16px 14px 0" }}>
                <b style={{ display: "block", color: D.text }}>{t.subject}</b>
                <small style={{ color: D.muted }}>{t.description.substring(0, 50)}...</small>
              </td>
              <td style={{ padding: "14px 16px 14px 0", color: D.muted }}>{t.created_by?.full_name || "Unknown"}</td>
              <td style={{ padding: "14px 16px 14px 0" }}>
                <span style={{ borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, background: t.status === "open" ? "#ef444422" : t.status==="in_progress" ? "#f59e0b22" : "#19c37d22", color: t.status === "open" ? "#ef4444" : t.status==="in_progress" ? "#f59e0b" : D.accent }}>
                  {t.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: "14px 0", textAlign: "right" }}>
                <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)} style={{ background: "transparent", border: `1px solid ${D.border}`, color: D.text, padding: "4px 8px", borderRadius: 4, outline: "none" }}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── NOTICES ─────────────────────────────────────────────────────────────
function NoticesWorkspace() {
  const [notices, setNotices] = useState<any[]>([]);
  useEffect(() => {
    supabase?.from("notices").select("*").order("published_at", { ascending: false }).then(({ data }) => setNotices(data || []));
  }, []);

  const remove = async (id: string) => {
    if(!supabase) return;
    await supabase.from("notices").delete().eq("id", id);
    setNotices(ns => ns.filter(n => n.id !== id));
  };

  return (
    <section style={{ borderRadius: 12, background: D.card, padding: 24, border: `1px solid ${D.border}` }}>
      <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${D.border}` }}>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>TITLE</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>DATE</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "right" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {notices.map(n => (
            <tr key={n.id} style={{ borderBottom: `1px solid ${D.border}` }}>
              <td style={{ padding: "14px 16px 14px 0" }}>
                <b style={{ display: "block", color: D.text }}>{n.title}</b>
                <small style={{ color: D.muted }}>{n.summary?.substring(0, 50)}...</small>
              </td>
              <td style={{ padding: "14px 16px 14px 0", color: D.muted }}>{new Date(n.published_at).toLocaleDateString()}</td>
              <td style={{ padding: "14px 0", textAlign: "right" }}>
                <button onClick={() => remove(n.id)} style={{ background: "transparent", border: `1px solid #ef444444`, color: "#ef4444", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────
function UsersWorkspace() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    supabase?.from("profiles").select(`*, user_roles(role)`).order("created_at", { ascending: false }).then(({ data }) => setUsers(data || []));
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
    <section style={{ borderRadius: 12, background: D.card, padding: 24, border: `1px solid ${D.border}` }}>
      <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${D.border}` }}>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>USER</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>ROLE</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "left" }}>JOINED</th>
            <th style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, color: D.muted, textAlign: "right" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: `1px solid ${D.border}` }}>
              <td style={{ padding: "14px 16px 14px 0" }}>
                <b style={{ display: "block", color: D.text }}>{u.full_name || "Unknown"}</b>
              </td>
              <td style={{ padding: "14px 16px 14px 0" }}>
                <span style={{ borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, background: "#6366f122", color: "#6366f1", textTransform: "uppercase" }}>
                  {u.user_roles?.[0]?.role || "student"}
                </span>
              </td>
              <td style={{ padding: "14px 16px 14px 0", color: D.muted }}>{new Date(u.created_at).toLocaleDateString()}</td>
              <td style={{ padding: "14px 0", textAlign: "right" }}>
                <select value={u.user_roles?.[0]?.role || "student"} onChange={e => updateRole(u.id, e.target.value)} style={{ background: "transparent", border: `1px solid ${D.border}`, color: D.text, padding: "4px 8px", borderRadius: 4, outline: "none", marginRight: 8 }}>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="dept_admin">Dept Admin</option>
                  <option value="administrator">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <button onClick={() => deleteUser(u.id, u.full_name)} style={{ background: "transparent", border: "1px solid #ef444444", color: "#ef4444", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Delete</button>
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
    <section style={{ borderRadius: 12, background: D.card, padding: 24, border: `1px solid ${D.border}` }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text, marginBottom: 16 }}>Live AI Interactions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ padding: 16, borderRadius: 8, background: D.bg, border: `1px solid ${D.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: D.accent }}>{m.profiles?.full_name || "Unknown User"}</span>
              <span style={{ fontSize: 11, color: D.muted }}>{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p style={{ fontSize: 14, color: D.text }}>{m.content}</p>
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

  const ingest = async () => {
    if (!supabase) { setStatus("Supabase is not configured."); return; }
    setBusy(true); setStatus("Fetching the official page...");
    const result = await scrapeDeKut(url);
    if (result.error) { setBusy(false); setStatus(`Failed: ${result.error}`); return; }
    setStatus("Saving document record...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); setStatus("Session expired. Sign in again."); return; }
    const path = `admin/${user.id}/${crypto.randomUUID()}.txt`;
    const { error: se } = await supabase.storage.from("documents").upload(path, result.text || "", { contentType: "text/plain" });
    if (se) { setBusy(false); setStatus(se.message); return; }
    const { data: doc, error: de } = await supabase.from("documents").insert({ title: result.title || "DeKUT Webpage", category: "Administration", source_url: url, storage_path: path, file_type: "txt", uploaded_by: user.id, metadata: { processing_status: "processing" } }).select("id").single();
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
    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const path = `admin/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: se } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (se) { setBusy(false); setStatus(se.message); return; }
    const { data: doc, error: de } = await supabase.from("documents").insert({ title: file.name.replace(/\.[^.]+$/, ""), category: "Administration", storage_path: path, file_type: ext, uploaded_by: user.id, metadata: { processing_status: ext === "txt" ? "processing" : "uploaded_pending_extraction", original_name: file.name } }).select("id,title").single();
    if (de) { setBusy(false); setStatus(de.message); return; }
    if (ext === "txt") {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke("ingest-document", { body: { documentId: doc.id, text } });
      setStatus(error ? `Uploaded but indexing failed: ${error.message}` : `✓ ${doc.title} indexed into ${data?.chunks || 0} chunks.`);
    } else {
      setStatus(`Extracting text from ${ext.toUpperCase()}...`);
      const { data, error } = await supabase.functions.invoke("process-document", { body: { documentId: doc.id, storagePath: path, extension: ext } });
      setStatus(error ? `Extraction failed: ${error.message}` : `✓ ${doc.title} indexed into ${data?.chunks || 0} chunks.`);
    }
    setBusy(false);
  };

  const suggestions: [string, string][] = [
    ["Registration rules", "registration.dkut.ac.ke/index.php/international/admission/rules"],
    ["University home", "www.dkut.ac.ke/index.php"],
    ["Admissions portal", "admissions.dkut.ac.ke"],
  ];

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.1fr 0.9fr", marginBottom: 20 }} className="xl:grid-cols-[1.1fr_.9fr] grid-cols-1">
      <section style={{ borderRadius: 12, background: D.card, padding: 24, border: `1px solid ${D.border}` }}>
        <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: D.text }}>
          <ShieldCheck size={17} style={{ color: D.accent }} /> Import an official DeKUT source
        </p>
        <p style={{ marginTop: 8, fontSize: 13, color: D.muted, lineHeight: 1.7 }}>
          Only official <b style={{ color: D.text }}>dkut.ac.ke</b> webpages. KiliGuide stores the source URL, extracts content, and creates RAG embeddings.
        </p>
        <label style={{ display: "block", marginTop: 18, fontSize: 12, fontWeight: 700, color: D.muted }}>
          OFFICIAL URL
          <input value={url} onChange={e => setUrl(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 8, border: `1px solid ${D.border}`, background: D.bg, color: D.text, padding: "10px 12px", fontSize: 13, outline: "none" }}
            onFocus={e => (e.currentTarget.style.borderColor = "#525252")}
            onBlur={e => (e.currentTarget.style.borderColor = D.border)} />
        </label>
        <button disabled={busy} onClick={ingest} style={{ marginTop: 14, borderRadius: 8, background: busy ? D.card : D.accent, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: busy ? D.muted : "#000", cursor: busy ? "not-allowed" : "pointer", border: "none" }}>
          {busy ? "Indexing…" : "Scrape into knowledge base"}
        </button>

        <div style={{ margin: "20px 0", borderTop: `1px solid ${D.border}` }} />

        <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: D.text }}>
          <Upload size={15} /> Upload PDF, DOCX, or TXT
        </p>
        <input onChange={e => setFile(e.target.files?.[0] ?? null)} accept=".pdf,.docx,.txt" type="file"
          style={{ display: "block", marginTop: 10, fontSize: 13, color: D.muted, width: "100%" }} />
        <button disabled={busy || !file} onClick={upload} style={{ marginTop: 10, borderRadius: 8, border: `1px solid ${D.border}`, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: busy || !file ? D.muted : D.text, cursor: busy || !file ? "not-allowed" : "pointer", background: "transparent" }}>
          {busy ? "Working…" : file ? `Upload ${file.name}` : "Choose a file"}
        </button>
        {status && (
          <p style={{ marginTop: 12, borderRadius: 8, padding: "10px 14px", fontSize: 13, background: status.startsWith("✓") ? "#19c37d22" : "#ef444422", color: status.startsWith("✓") ? D.accent : "#ef4444" }}>{status}</p>
        )}
      </section>

      <section style={{ borderRadius: 12, background: "#19c37d15", padding: 24, border: `1px solid #19c37d33` }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: D.accent }}>SUGGESTED FIRST SOURCES</p>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {suggestions.map(([name, address]) => (
            <button key={address} onClick={() => setUrl(`https://${address}`)}
              style={{ display: "block", width: "100%", borderRadius: 10, border: `1px solid #19c37d33`, padding: "12px 14px", textAlign: "left", background: "transparent", cursor: "pointer", color: D.text }}
              onMouseEnter={e => (e.currentTarget.style.background = "#19c37d11")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <b style={{ display: "block", fontSize: 13 }}>{name}</b>
              <small style={{ marginTop: 2, display: "block", fontSize: 11, color: D.muted }}>{address}</small>
            </button>
          ))}
        </div>
      </section>
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

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("documents").select("id,title,category,file_type,status,processing_status,source_url,storage_path,chunk_count,created_at,processing_error").order("created_at", { ascending: false });
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
    if (d.processing_status === "ready") return { bg: "#19c37d22", text: D.accent };
    if (d.processing_status === "failed") return { bg: "#ef444422", text: "#ef4444" };
    return { bg: "#f59e0b22", text: "#f59e0b" };
  };

  return (
    <section style={{ borderRadius: 12, background: D.card, padding: 24, border: `1px solid ${D.border}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: D.text }}>Knowledge base documents</h2>
          <p style={{ marginTop: 4, fontSize: 13, color: D.muted }}>Review, archive, or remove every approved source.</p>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, border: `1px solid ${D.border}`, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: D.muted, background: "transparent", cursor: "pointer" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <label style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, borderRadius: 8, border: `1px solid ${D.border}`, padding: "8px 12px", background: D.bg }}>
          <Search size={14} style={{ color: D.muted, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: D.text }} placeholder="Search documents or source URL" />
        </label>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ borderRadius: 8, border: `1px solid ${D.border}`, padding: "8px 12px", fontSize: 13, background: D.bg, color: D.text, outline: "none" }}>
          <option value="all">All statuses</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
          <option value="uploaded">Uploaded</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {notice && (
        <p style={{ marginTop: 12, borderRadius: 8, padding: "10px 14px", fontSize: 13, background: notice.includes("deleted") || notice.includes("archived") || notice.includes("restored") ? "#19c37d22" : "#ef444422", color: notice.includes("deleted") || notice.includes("archived") || notice.includes("restored") ? D.accent : "#ef4444" }}>{notice}</p>
      )}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${D.border}` }}>
              {["Document", "Source", "Status", "RAG", "Controls"].map((h, i) => (
                <th key={h} style={{ paddingBottom: 10, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: D.muted, textAlign: i === 4 ? "right" : "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "32px 0", textAlign: "center", color: D.muted }}>Loading knowledge base…</td></tr>
            ) : visible.length ? visible.map(d => {
              const sc = statusColor(d);
              return (
                <tr key={d.id} style={{ borderBottom: `1px solid ${D.border}` }}>
                  <td style={{ padding: "14px 16px 14px 0" }}>
                    <b style={{ display: "block", color: D.text }}>{d.title}</b>
                    <small style={{ color: D.muted }}>{d.category} · {d.file_type.toUpperCase()} · {new Date(d.created_at).toLocaleDateString()}</small>
                  </td>
                  <td style={{ padding: "14px 16px 14px 0", maxWidth: 160, fontSize: 12 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#6366f1" }}>{d.source_url ?? "Uploaded file"}</span>
                  </td>
                  <td style={{ padding: "14px 16px 14px 0" }}>
                    <span style={{ borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text }}>
                      {d.status === "archived" ? "Archived" : d.processing_status ?? "Uploaded"}
                    </span>
                    {d.processing_error && <small style={{ display: "block", color: "#ef4444", marginTop: 3, maxWidth: 140 }}>{d.processing_error}</small>}
                  </td>
                  <td style={{ padding: "14px 16px 14px 0", fontSize: 12, color: D.muted }}>{d.chunk_count ?? 0} chunks</td>
                  <td style={{ padding: "14px 0", textAlign: "right" }}>
                    <button onClick={() => archive(d)} style={{ borderRadius: 6, border: `1px solid ${D.border}`, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: D.muted, background: "transparent", cursor: "pointer", marginRight: 6 }}>
                      {d.status === "archived" ? "Restore" : "Archive"}
                    </button>
                    <button onClick={() => remove(d)} style={{ borderRadius: 6, border: "1px solid #ef444444", padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#ef4444", background: "transparent", cursor: "pointer" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={5} style={{ padding: "32px 0", textAlign: "center", color: D.muted }}>No documents match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Compose modal ─────────────────────────────────────────────────────────
function Compose({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const save = async () => {
    if(!supabase || !title.trim() || !body.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("notices").insert({
      title,
      body,
      summary: body.substring(0, 100),
      author_id: user?.id,
      category: "General"
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.7)", padding: 16 }}>
      <section style={{ width: "100%", maxWidth: 460, borderRadius: 14, background: D.card, padding: 28, border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: D.text }}>Create a Notice</h2>
          <button onClick={onClose} style={{ color: D.muted, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        <label style={{ display: "block", marginTop: 20, fontSize: 12, fontWeight: 700, color: D.muted }}>
          TITLE
          <input value={title} onChange={e=>setTitle(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 8, border: `1px solid ${D.border}`, background: D.bg, color: D.text, padding: "10px 12px", fontSize: 13, outline: "none" }} placeholder="Add a clear title"
            onFocus={e => (e.currentTarget.style.borderColor = "#525252")}
            onBlur={e => (e.currentTarget.style.borderColor = D.border)} />
        </label>
        <label style={{ display: "block", marginTop: 16, fontSize: 12, fontWeight: 700, color: D.muted }}>
          MESSAGE
          <textarea value={body} onChange={e=>setBody(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6, borderRadius: 8, border: `1px solid ${D.border}`, background: D.bg, color: D.text, padding: "10px 12px", fontSize: 13, outline: "none", minHeight: 100, resize: "vertical" }} placeholder="What should the university community know?"
            onFocus={e => (e.currentTarget.style.borderColor = "#525252")}
            onBlur={e => (e.currentTarget.style.borderColor = D.border)} />
        </label>
        <button onClick={save} style={{ marginTop: 20, width: "100%", borderRadius: 8, background: D.accent, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#000", cursor: "pointer", border: "none" }}>Publish Notice</button>
      </section>
    </div>
  );
}
