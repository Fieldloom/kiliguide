"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomePage } from "../components/welcome-page";
import { getRoleDestination } from "../lib/auth";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getRoleDestination().then((destination) => {
      if (destination && destination !== "/login") {
        router.replace(destination);
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] text-sm text-emerald-500 font-medium">
        Loading KiliGuide...
      </main>
    );
  }

  return <WelcomePage />;
}
