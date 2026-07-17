"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleDestination } from "../../../lib/auth";

export default function AuthCallback(){const router=useRouter();useEffect(()=>{getRoleDestination().then((destination)=>router.replace(destination));},[router]);return <main className="grid min-h-screen place-items-center bg-[#f5f8fc] text-sm text-slate-500">Preparing your KiliGuide workspace…</main>}
