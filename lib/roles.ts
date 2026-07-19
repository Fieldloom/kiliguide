export const appRoles = ["super_admin", "dept_admin", "administrator", "department", "staff", "lecturer", "student", "parent", "visitor"] as const;
export type AppRole = (typeof appRoles)[number];

export const roleHome: Record<AppRole, string> = {
  super_admin: "/portal/admin",
  dept_admin: "/portal/dept_admin",
  administrator: "/portal/administrator",
  department: "/portal/department",
  staff: "/portal/staff",
  lecturer: "/portal/lecturer",
  student: "/portal/student",
  parent: "/portal/parent",
  visitor: "/onboarding",
};

export function isAppRole(value: string): value is AppRole { return appRoles.includes(value as AppRole); }
