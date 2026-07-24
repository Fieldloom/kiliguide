"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { GraduationCap, Users, User, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

type RoleOption = "student" | "staff" | "parent" | "visitor";

export default function Onboarding() {
  const router = useRouter();
  const [role, setRole] = useState<RoleOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form fields
  const [regNum, setRegNum] = useState("");
  const [department, setDepartment] = useState("");
  const [linkedReg, setLinkedReg] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [alreadyHasInstitution, setAlreadyHasInstitution] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      // Load institutions for the dropdown
      const { data: insts } = await supabase!.from("institutions").select("id, name").order("name");
      if (insts) setInstitutions(insts);
      // Check if institution already set (e.g. from signup metadata)
      const uid = data.user?.id;
      if (uid) {
        const { data: prof } = await supabase!.from("profiles").select("institution_id").eq("id", uid).single();
        if (prof?.institution_id) setAlreadyHasInstitution(true);
      }
      
      const { data: settings } = await supabase!.from("system_settings").select("value").eq("key", "allow_institution_registration").single();
      if (settings && settings.value === 'false') {
        setAllowRegistration(false);
        setInstitutionId("00000000-0000-0000-0000-000000000001");
      }
    });
  }, []);

  const completeOnboarding = async () => {
    if (!role || !user || !supabase) return;
    setLoading(true);

    try {
      // 1. Update Profile (include institution_id if not already set)
      const updates: any = {};
      if (role === "student") updates.registration_number = regNum;
      if (role === "parent") updates.registration_number = linkedReg;
      if (!alreadyHasInstitution && institutionId) updates.institution_id = institutionId;
      
      await supabase.from("profiles").update(updates).eq("id", user.id);

      // 2. Update Role
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      await supabase.from("user_roles").insert({ user_id: user.id, role });

      // 3. Redirect
      router.replace(`/portal/${role}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const OptionCard = ({ type, title, desc, icon: Icon }: { type: RoleOption, title: string, desc: string, icon: any }) => (
    <div 
      onClick={() => setRole(type)}
      style={{
        borderRadius: 16, border: `2px solid ${role === type ? "#19c37d" : "#1A2A20"}`,
        background: role === type ? "rgba(25, 195, 125, 0.05)" : "#0B0F14",
        padding: "24px", cursor: "pointer", transition: "all 0.2s",
        display: "flex", gap: 16, alignItems: "center"
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: role === type ? "#19c37d" : "#131820", display: "grid", placeItems: "center", color: role === type ? "#000" : "#ececec" }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ececec", marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#8e8ea0" }}>{desc}</p>
      </div>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${role === type ? "#19c37d" : "#333"}`, background: role === type ? "#19c37d" : "transparent", display: "grid", placeItems: "center" }}>
        {role === type && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#000" }} />}
      </div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 600 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>Welcome to KiliGuide</h1>
          <p style={{ fontSize: 16, color: "#8e8ea0" }}>Please select your account type to personalize your workspace.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <OptionCard type="student" title="I am a Student" desc="Access timetables, exams, and campus resources." icon={GraduationCap} />
          <OptionCard type="staff" title="I am Staff" desc="Manage department files, notices, and internal docs." icon={ShieldCheck} />
          <OptionCard type="parent" title="I am a Parent" desc="Track fee balances and official student updates." icon={Users} />
          <OptionCard type="visitor" title="I am a Visitor" desc="Explore public campus information." icon={User} />
        </div>

        {role === "student" && (
          <div style={{ marginBottom: 32, animation: "fadeIn 0.3s ease" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ececec", marginBottom: 8 }}>Registration Number</label>
            <input value={regNum} onChange={e => setRegNum(e.target.value)} placeholder="e.g. C026-01-0982/2021" style={{ width: "100%", background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none" }} />
          </div>
        )}

        {role === "staff" && (
          <div style={{ marginBottom: 32, animation: "fadeIn 0.3s ease" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ececec", marginBottom: 8 }}>Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} style={{ width: "100%", background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none", appearance: "none" }}>
              <option value="">Select your department...</option>
              <option value="cs">Computer Science</option>
              <option value="eng">Engineering</option>
              <option value="finance">Finance Office</option>
              <option value="registry">Registry</option>
            </select>
          </div>
        )}

        {role === "parent" && (
          <div style={{ marginBottom: 32, animation: "fadeIn 0.3s ease" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ececec", marginBottom: 8 }}>Student's Registration Number</label>
            <input value={linkedReg} onChange={e => setLinkedReg(e.target.value)} placeholder="Enter your child's Reg No" style={{ width: "100%", background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none" }} />
            <p style={{ fontSize: 12, color: "#6b6b80", marginTop: 8 }}>We will verify this with the university records.</p>
          </div>
        )}

        {/* Institution Selection — shown if not already detected from signup, and registration allowed */}
        {!alreadyHasInstitution && allowRegistration && (
          <div style={{ marginBottom: 32, animation: "fadeIn 0.3s ease" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#ececec", marginBottom: 8 }}>Your University</label>
            <select value={institutionId} onChange={e => setInstitutionId(e.target.value)} style={{ width: "100%", background: "#0B0F14", border: "1px solid #1A2A20", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none", appearance: "none" }}>
              <option value="">Select your university…</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          onClick={completeOnboarding}
          disabled={!role || loading || (role === "student" && !regNum) || (role === "parent" && !linkedReg) || (role === "staff" && !department) || (!alreadyHasInstitution && !institutionId)}
          style={{ width: "100%", background: role ? "#19c37d" : "#1A2A20", color: role ? "#000" : "#8e8ea0", padding: "16px", borderRadius: 12, fontSize: 16, fontWeight: 600, border: "none", cursor: role ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : "Complete Setup"}
          {!loading && <ArrowRight size={20} />}
        </button>

      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
