"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type LucideIcon, BarChart3, Bell, ChevronRight, FileText, GraduationCap, LayoutDashboard, MessageSquareText, Plus, Send, ShieldCheck, Ticket, Sparkles } from "lucide-react";
import { isAppRole, type AppRole } from "../../../lib/roles";
import { RoleGate } from "../../../components/role-gate";
import { AdminWorkspace } from "../../../components/admin-workspace";
import { StudentWorkspace } from "../../../components/student-workspace";
import { ParentWorkspace } from "../../../components/parent-workspace";
import { LecturerWorkspace } from "../../../components/lecturer-workspace";
import { DeptWorkspace } from "../../../components/dept-workspace";

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
  
  if(role === "administrator" || role === "super_admin") return <RoleGate role={role}><AdminWorkspace role={role} /></RoleGate>;
  if(role === "parent") return <RoleGate role={role}><ParentWorkspace/></RoleGate>;
  if(role === "lecturer" || role === "staff") return <RoleGate role={role}><LecturerWorkspace/></RoleGate>;
  if(role === "department" || role === "dept_admin") return <RoleGate role={role}><DeptWorkspace/></RoleGate>;
  
  // Default to student workspace for students and visitors
  return <RoleGate role={role}><StudentWorkspace/></RoleGate>;
}
