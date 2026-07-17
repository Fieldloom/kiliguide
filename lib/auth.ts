import { supabase } from "./supabase";
import { roleHome, type AppRole } from "./roles";

const rank: AppRole[] = ["administrator", "department", "lecturer", "student"];
export async function getSignedInRole(): Promise<AppRole | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = new Set((data ?? []).map((entry) => entry.role as AppRole));
  return rank.find((role) => roles.has(role)) ?? "student";
}
export async function getRoleDestination() { const role = await getSignedInRole(); return role ? roleHome[role] : "/login"; }
