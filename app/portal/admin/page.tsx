"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  ShieldAlert, Users, Building, ShieldCheck, UserCheck,
  Globe, RefreshCw, CheckCircle2, XCircle, Clock, Zap, Database
} from "lucide-react";

type CrawlStatus = {
  pending: number; crawling: number; done: number; failed: number; total: number; last_crawled_at: string | null;
};

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus | null>(null);
  const [crawlQueue, setCrawlQueue] = useState<any[]>([]);
  const [crawling, setCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "crawler">("users");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    const [profilesResult, deptsResult, crawlSummaryResult, crawlQueueResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name, registration_number, user_roles ( role )"),
      supabase.from("departments").select("*"),
      supabase.from("crawl_queue").select("status").then(r => r),
      supabase.from("crawl_queue").select("id, url, status, error, last_crawled_at").order("discovered_at", { ascending: false }).limit(50),
    ]);

    setDepartments(deptsResult.data || []);
    setUsers(profilesResult.data || []);
    setCrawlQueue(crawlQueueResult.data || []);

    // Compute summary from raw rows
    const rows = crawlSummaryResult.data || [];
    const summary: CrawlStatus = { pending: 0, crawling: 0, done: 0, failed: 0, total: rows.length, last_crawled_at: null };
    for (const r of rows) {
      if (r.status === "pending") summary.pending++;
      else if (r.status === "crawling") summary.crawling++;
      else if (r.status === "done") summary.done++;
      else if (r.status === "failed") summary.failed++;
    }
    setCrawlStatus(summary);
    setLoading(false);
  };

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

  const promoteToDeptAdmin = async (userId: string, departmentId: string) => {
    if (!supabase) return;
    await supabase.from("profiles").update({ department_id: departmentId }).eq("id", userId);
    await supabase.from("user_roles").update({ role: "dept_admin" }).eq("user_id", userId);
    alert("User promoted to Department Admin successfully.");
    fetchData();
  };

  const card = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
    <div style={{ background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ color }}>{icon}</span>
        <b style={{ fontSize: 15 }}>{label}</b>
      </div>
      <span style={{ fontSize: 32, fontWeight: 800 }}>{value}</span>
    </div>
  );

  if (loading) return <div style={{ minHeight: "100vh", background: "#06080A", display: "grid", placeItems: "center", color: "#ececec" }}>Loading Admin Portal...</div>;

  return (
    <main className="ambient-bg" style={{ minHeight: "100vh", color: "#ececec", padding: "60px 24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 10 }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid #131820" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(25, 195, 125, 0.1)", display: "grid", placeItems: "center", color: "#19c37d" }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Super Admin Portal</h1>
            <p style={{ color: "#8e8ea0", fontSize: 15 }}>Global system access — manage users and AI knowledge base.</p>
          </div>
        </header>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          {card(<Users size={20} />, "Total Users", users.length, "#3b82f6")}
          {card(<Building size={20} />, "Departments", departments.length, "#facc15")}
          {card(<ShieldCheck size={20} />, "Dept Admins", users.filter(u => u.user_roles?.some((r: any) => r.role === "dept_admin")).length, "#19c37d")}
          {card(<Database size={20} />, "Pages Indexed", crawlStatus?.done ?? 0, "#a78bfa")}
          {card(<Clock size={20} />, "Pending Crawl", crawlStatus?.pending ?? 0, "#fb923c")}
          {card(<XCircle size={20} />, "Failed Crawl", crawlStatus?.failed ?? 0, "#f87171")}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "#0B0F14", border: "1px solid #131820", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {(["users", "crawler"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: activeTab === tab ? "#1A2A20" : "transparent", color: activeTab === tab ? "#19c37d" : "#8e8ea0", fontWeight: 600, fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>
              {tab === "users" ? "User Management" : "AI Crawler"}
            </button>
          ))}
        </div>

        {/* ── USER MANAGEMENT TAB ── */}
        {activeTab === "users" && (
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Staff Promotion</h2>
            <div style={{ background: "#0B0F14", border: "1px solid #131820", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#131820", textAlign: "left", fontSize: 12, color: "#8e8ea0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "14px 20px" }}>Name</th>
                    <th style={{ padding: "14px 20px" }}>Role</th>
                    <th style={{ padding: "14px 20px" }}>Promote to Dept Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const role = u.user_roles?.[0]?.role ?? "unknown";
                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #131820" }}>
                        <td style={{ padding: "14px 20px" }}>
                          <b style={{ fontSize: 14, display: "block" }}>{u.full_name || "Unnamed"}</b>
                          <span style={{ fontSize: 11, color: "#8e8ea0", fontFamily: "monospace" }}>{u.id.slice(0, 16)}...</span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: role === "super_admin" ? "#facc15" : role === "dept_admin" ? "#19c37d" : "#ececec" }}>
                            {role}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          {role === "staff" ? (
                            <div style={{ display: "flex", gap: 8 }}>
                              <select id={`dept-${u.id}`} style={{ background: "#06080A", border: "1px solid #1A2A20", color: "#ececec", padding: "6px 10px", borderRadius: 8, fontSize: 13, outline: "none" }}>
                                <option value="">Select department...</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                              <button onClick={() => { const s = document.getElementById(`dept-${u.id}`) as HTMLSelectElement; if (s.value) promoteToDeptAdmin(u.id, s.value); else alert("Select a department first."); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#19c37d", color: "#000", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                <UserCheck size={14} /> Promote
                              </button>
                            </div>
                          ) : <span style={{ fontSize: 13, color: "#6b6b80" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── AI CRAWLER TAB ── */}
        {activeTab === "crawler" && (
          <section>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>

              {/* Discover Card */}
              <div style={{ background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Globe size={20} style={{ color: "#3b82f6" }} />
                  <b style={{ fontSize: 16 }}>1. Discover URLs</b>
                </div>
                <p style={{ fontSize: 13, color: "#8e8ea0", marginBottom: 20, lineHeight: 1.6 }}>
                  Fetch the DeKUT sitemap and add all eligible pages to the crawl queue. Does not scrape yet.
                </p>
                <button disabled={crawling} onClick={() => triggerCrawl("discover")} style={{ width: "100%", background: "#1A2A20", color: "#19c37d", border: "1px solid #19c37d30", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: crawling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Globe size={16} /> Discover Pages
                </button>
              </div>

              {/* Crawl Pending Card */}
              <div style={{ background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Zap size={20} style={{ color: "#facc15" }} />
                  <b style={{ fontSize: 16 }}>2. Crawl & Embed</b>
                </div>
                <p style={{ fontSize: 13, color: "#8e8ea0", marginBottom: 20, lineHeight: 1.6 }}>
                  Scrape {crawlStatus?.pending ?? 0} pending URLs, extract text, and store AI vector embeddings. Processes 20 at a time.
                </p>
                <button disabled={crawling} onClick={() => triggerCrawl("crawl")} style={{ width: "100%", background: "#1A2A20", color: "#facc15", border: "1px solid #facc1530", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: crawling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Zap size={16} /> Process Queue
                </button>
              </div>
            </div>

            {/* Full Crawl */}
            <div style={{ background: "#0B0F14", border: "1px solid #f87171", borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <RefreshCw size={20} style={{ color: "#f87171" }} />
                    <b style={{ fontSize: 16 }}>Full Crawl (Discover + Process)</b>
                  </div>
                  <p style={{ fontSize: 13, color: "#8e8ea0" }}>Discovers new pages from sitemap AND processes 20 pending URLs in one shot.</p>
                </div>
                <button disabled={crawling} onClick={() => triggerCrawl("full")} style={{ whiteSpace: "nowrap", background: "#f87171", color: "#000", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: crawling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: crawling ? 0.6 : 1 }}>
                  {crawling ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Running...</> : <><RefreshCw size={16} /> Run Full Crawl</>}
                </button>
              </div>
            </div>

            {/* Crawl Log Message */}
            {crawlMessage && (
              <div style={{ background: crawlMessage.startsWith("✅") ? "rgba(25,195,125,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${crawlMessage.startsWith("✅") ? "#19c37d40" : "#f8717140"}`, borderRadius: 10, padding: 16, marginBottom: 24, fontSize: 14, color: crawlMessage.startsWith("✅") ? "#19c37d" : "#f87171" }}>
                {crawlMessage}
              </div>
            )}

            {/* Recent Crawl Queue */}
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Crawl Queue</h3>
            <div style={{ background: "#0B0F14", border: "1px solid #131820", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#131820", textAlign: "left", fontSize: 12, color: "#8e8ea0", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 20px" }}>URL</th>
                    <th style={{ padding: "12px 20px" }}>Status</th>
                    <th style={{ padding: "12px 20px" }}>Last Crawled</th>
                  </tr>
                </thead>
                <tbody>
                  {crawlQueue.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: "32px 20px", textAlign: "center", color: "#8e8ea0" }}>No pages in queue yet. Run "Discover Pages" first.</td></tr>
                  ) : crawlQueue.map(row => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #131820" }}>
                      <td style={{ padding: "12px 20px", fontSize: 12, color: "#ececec", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>{row.url}</a>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: row.status === "done" ? "rgba(25,195,125,0.1)" : row.status === "failed" ? "rgba(248,113,113,0.1)" : row.status === "crawling" ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.05)", color: row.status === "done" ? "#19c37d" : row.status === "failed" ? "#f87171" : row.status === "crawling" ? "#fbbf24" : "#8e8ea0" }}>
                          {row.status === "done" ? <CheckCircle2 size={12} /> : row.status === "failed" ? <XCircle size={12} /> : <Clock size={12} />}
                          {row.status}
                        </span>
                        {row.error && <span title={row.error} style={{ fontSize: 11, color: "#f87171", display: "block", marginTop: 4 }}>⚠ {row.error.slice(0, 60)}...</span>}
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 12, color: "#8e8ea0" }}>
                        {row.last_crawled_at ? new Date(row.last_crawled_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
