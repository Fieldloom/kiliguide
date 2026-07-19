"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type LucideIcon, BarChart3, Bell, ChevronRight, FileText, GraduationCap, LayoutDashboard, MessageSquareText, Plus, Send, ShieldCheck, Ticket, Sparkles } from "lucide-react";
import { isAppRole, type AppRole } from "../../../lib/roles";
import { RoleGate } from "../../../components/role-gate";
import { AdminWorkspace } from "../../../components/admin-workspace";
import { StudentWorkspace } from "../../../components/student-workspace";

type Portal = { label:string; title:string; subtitle:string; accent:string; stats:[string,string][]; tasks:string[] };
const portals: Record<AppRole, Portal> = {
  super_admin:{label:"SUPER ADMIN",title:"Global System Management.",subtitle:"Manage access, promote staff, and view analytics.",accent:"#ca8a04",stats:[["100+","Total Users"],["12","Departments"]],tasks:["Review new staff registrations"]},
  dept_admin:{label:"DEPARTMENT ADMIN",title:"Manage your department resources.",subtitle:"Publish departmental notices and review staff access.",accent:"#10b981",stats:[["14","Tickets awaiting action"],["09","Active notices"]],tasks:["Review the new hostel policy notice"]},
  administrator:{label:"ADMINISTRATOR",title:"A healthier, more informed campus.",subtitle:"Manage people, knowledge and service delivery across the university.",accent:"#94a3b8",stats:[["2,481","Active users"],["48","Live documents"],["96%","Grounded answer rate"]],tasks:["Review knowledge-base processing queue","Assign user roles for new staff","Check weekly service analytics"]},
  department:{label:"DEPARTMENT WORKSPACE",title:"Keep students moving forward.",subtitle:"Manage departmental notices, documents, and support requests from a single workspace.",accent:"#10b981",stats:[["14","Tickets awaiting action"],["09","Active notices"],["37","Knowledge base documents"]],tasks:["Assign three unassigned support tickets","Review the new hostel policy notice","Archive the 2025 fee structure"]},
  staff:{label:"STAFF WORKSPACE",title:"Support your department with clarity.",subtitle:"Publish course notices, share verified resources, and see the questions students are asking.",accent:"#8b5cf6",stats:[["126","Student questions"],["08","Department documents"]],tasks:["Publish the assessment timetable"]},
  lecturer:{label:"LECTURER PORTAL",title:"Support your department with clarity.",subtitle:"Publish course notices, share verified resources, and see the questions students are asking.",accent:"#8b5cf6",stats:[["126","Student questions"],["08","Department documents"],["03","Draft notices"]],tasks:["Publish the assessment timetable","Review unanswered student questions","Upload course outline updates"]},
  student:{label:"STUDENT PORTAL",title:"Everything for your semester, in one place.",subtitle:"Find trusted answers, keep track of deadlines, and get help from the right office.",accent:"#3b82f6",stats:[["02","Upcoming deadlines"],["48","Searchable documents"],["02","Open support tickets"]],tasks:["Complete fee payment before 25 July","Register Semester II courses","Review the examination guidelines"]},
  parent:{label:"PARENT PORTAL",title:"Stay updated on your child's journey.",subtitle:"Access fee statements, academic progress, and official campus notices.",accent:"#f97316",stats:[["0","Fee Balance"],["1","New Notice"]],tasks:["Review fee statement"]},
  visitor:{label:"VISITOR PORTAL",title:"Explore KiliGuide.",subtitle:"Sign up to access more features.",accent:"#6b7280",stats:[],tasks:[]},
};
const items: [LucideIcon,string][] = [[LayoutDashboard,"Overview"],[MessageSquareText,"AI assistant"],[FileText,"Documents"],[Bell,"Notices"],[Ticket,"Tickets"],[BarChart3,"Analytics"]];

export default function RolePortal(){
  const params=useParams<{role:string}>(); 
  const role=isAppRole(params.role)?params.role:"student"; 
  const data=portals[role];
  if(role === "administrator") return <RoleGate role={role}><AdminWorkspace/></RoleGate>;
  if(role === "student") return <RoleGate role={role}><StudentWorkspace/></RoleGate>;
  
  return (
    <RoleGate role={role}>
      <main className="ambient-bg" style={{ minHeight: "100vh", color: "#ececec", fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header */}
        <header style={{ height: 70, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", background: data.accent, color: "#fff", fontWeight: 800, fontSize: 18, boxShadow: `0 4px 20px ${data.accent}40` }}>K</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <b style={{ color: "#fff", fontSize: 16, lineHeight: 1 }}>KiliGuide</b>
                <small style={{ color: data.accent, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", marginTop: 2 }}>{data.label}</small>
              </div>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer" }}><Bell size={20}/></button>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>U</span>
            </div>
          </div>
        </header>

        {/* Layout */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "grid", gap: 32, gridTemplateColumns: "1fr", alignItems: "start" }} className="lg:grid-cols-[240px_1fr]">
          
          {/* Sidebar */}
          <aside className="glass-panel hidden lg:flex" style={{ flexDirection: "column", padding: "16px 12px", position: "sticky", top: 100 }}>
            <p style={{ padding: "0 12px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280" }}>WORKSPACE</p>
            {items.map(([Icon,label])=>(
              <button key={label} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px", borderRadius: 12, background: "transparent", border: "none", color: "#a1a1aa", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-white/5 hover:text-white">
                <Icon size={18} /> {label}
              </button>
            ))}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, color: "#a1a1aa", fontSize: 14, textDecoration: "none", borderRadius: 12 }} className="hover:bg-white/5">
                <GraduationCap size={18}/> Switch portal
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <section style={{ paddingBottom: 100 }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg, ${data.accent}, ${data.accent}80)`, letterSpacing: "0.05em", marginBottom: 16 }}>
              {data.label}
            </span>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>{data.title}</h1>
            <p style={{ fontSize: 18, color: "#a1a1aa", lineHeight: 1.6, maxWidth: 600, marginBottom: 40 }}>{data.subtitle}</p>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
              {data.stats.map(s=>(
                <article key={s[1]} className="glass-panel" style={{ padding: 24 }}>
                  <b style={{ display: "block", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: "-0.03em" }}>{s[0]}</b>
                  <p style={{ fontSize: 14, color: "#a1a1aa", fontWeight: 500 }}>{s[1]}</p>
                </article>
              ))}
            </div>

            {/* Bottom Split */}
            <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }} className="xl:grid-cols-[1.2fr_0.8fr]">
              
              {/* Priority Actions */}
              <section className="glass-panel" style={{ padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Priority Actions</h2>
                  <button style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg, ${data.accent}, ${data.accent}80)`, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 16px ${data.accent}40` }}>
                    <Plus size={16}/> Create
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.tasks.map((task,index)=>(
                    <button key={task} className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", textAlign: "left", width: "100%" }}>
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: `${data.accent}20`, color: data.accent, fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center" }}>{index+1}</span>
                      <span style={{ flex: 1, fontSize: 15, color: "#ececec" }}>{task}</span>
                      <ChevronRight color="#6b7280" size={18}/>
                    </button>
                  ))}
                  {data.tasks.length === 0 && <p style={{ color: "#a1a1aa", fontSize: 14 }}>No pending actions.</p>}
                </div>
              </section>

              {/* AI Assistant Box */}
              <section className="glass-panel" style={{ padding: 32, background: "linear-gradient(to bottom right, rgba(16,185,129,0.1), rgba(0,0,0,0.6))", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: `radial-gradient(circle, ${data.accent}30 0%, transparent 70%)` }} />
                
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: data.accent, marginBottom: 24, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  <Sparkles size={16} /> KiliGuide AI
                </div>
                
                <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 12, letterSpacing: "-0.02em" }}>
                  What can I help your {role === "department" ? "department" : role} with today?
                </p>
                <p style={{ fontSize: 15, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 32 }}>
                  Get source-grounded answers extracted instantly from official DeKUT documents.
                </p>
                
                <div className="glass-input" style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, padding: "8px 8px 8px 20px" }}>
                  <input placeholder="Ask KiliGuide..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 15 }} />
                  <button style={{ width: 44, height: 44, borderRadius: "50%", background: data.accent, color: "#fff", border: "none", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, boxShadow: `0 4px 16px ${data.accent}50` }}>
                    <Send size={18} style={{ transform: "rotate(45deg)", marginLeft: -2 }} />
                  </button>
                </div>
              </section>

            </div>
          </section>
        </div>
      </main>
    </RoleGate>
  );
}
