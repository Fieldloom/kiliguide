import { supabase } from "./supabase";
import { roleHome, type AppRole } from "./roles";

const rank: AppRole[] = ["super_admin", "dept_admin", "administrator", "department", "staff", "lecturer", "student", "parent", "visitor"];

function getCachedRole(): AppRole | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem("kiliguide_user_role");
    if (cached && rank.includes(cached as AppRole)) {
      return cached as AppRole;
    }
  } catch (_) {}
  return null;
}

function setCachedRole(role: AppRole | null) {
  if (typeof window === "undefined") return;
  try {
    if (role) {
      localStorage.setItem("kiliguide_user_role", role);
    } else {
      localStorage.removeItem("kiliguide_user_role");
    }
  } catch (_) {}
}

export async function getSignedInRole(): Promise<AppRole | null> {
  if (!supabase) {
    return getCachedRole();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      // Offline fallback: if network failed or no active session fetched online, check cache
      const cached = getCachedRole();
      if (!user && !cached) setCachedRole(null);
      return cached;
    }

    let detectedRole: AppRole | null = null;

    // 1. Check user_roles table
    const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const roles = new Set((rolesData ?? []).map((entry) => entry.role as AppRole));
    const foundRole = rank.find((role) => roles.has(role));
    if (foundRole) detectedRole = foundRole;

    // 2. Check profile table
    if (!detectedRole) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role && rank.includes(profile.role as AppRole)) {
        detectedRole = profile.role as AppRole;
      }
    }

    // 3. Check auth metadata (stored during signup)
    if (!detectedRole) {
      const metaRole = user.user_metadata?.role;
      if (metaRole && rank.includes(metaRole as AppRole)) {
        detectedRole = metaRole as AppRole;
      }
    }

    const finalRole = detectedRole || "student";
    setCachedRole(finalRole);
    return finalRole;
  } catch (err) {
    // If request failed (e.g. offline mode), return cached role
    return getCachedRole();
  }
}

export async function getRoleDestination() { 
  const role = await getSignedInRole(); 
  return role ? roleHome[role] : "/login"; 
}
