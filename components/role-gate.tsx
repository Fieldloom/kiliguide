"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSignedInRole } from "../lib/auth";
import { type AppRole } from "../lib/roles";

export function RoleGate({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const router = useRouter(); const [ready, setReady] = useState(false);
  useEffect(() => { getSignedInRole().then((actual) => { if (!actual) router.replace("/login"); else if (actual !== role) router.replace(`/portal/${actual}`); else setReady(true); }); }, [role, router]);
  if (!ready) return <main className="grid min-h-screen place-items-center bg-[#f5f8fc] text-sm text-slate-500">Checking secure workspace access…</main>;
  return <>{children}</>;
}
