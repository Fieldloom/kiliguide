"use client";
import { AdminWorkspace } from "../../../components/admin-workspace";
import { RoleGate } from "../../../components/role-gate";

export default function AdminPortal() {
  return (
    <RoleGate role="administrator">
      <AdminWorkspace role="administrator" />
    </RoleGate>
  );
}
