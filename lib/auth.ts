import { supabase } from "./supabase";
import { roleHome, type AppRole } from "./roles";

const rank: AppRole[] = ["super_admin", "dept_admin", "administrator", "department", "staff", "lecturer", "student", "parent", "visitor"];
export async function getSignedInRole(): Promise<AppRole | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Check user_roles table
  const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = new Set((rolesData ?? []).map((entry) => entry.role as AppRole));
  const foundRole = rank.find((role) => roles.has(role));
  if (foundRole) return foundRole;

  // 2. Check profile table
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role && rank.includes(profile.role as AppRole)) {
    return profile.role as AppRole;
  }

  // 3. Check auth metadata (stored during signup)
  const metaRole = user.user_metadata?.role;
  if (metaRole && rank.includes(metaRole as AppRole)) {
    return metaRole as AppRole;
  }

  return "student";
}

export async function getRoleDestination() { 
  const role = await getSignedInRole(); 
  return role ? roleHome[role] : "/login"; 
}
