"use client";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export function InstallButton({ className, style, label = "Install App", collapsed = false }: { className?: string; style?: React.CSSProperties, label?: string, collapsed?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isInstallable) return null;

  return (
    <button 
      onClick={async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      }}
      className={className}
      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: "transparent", border: "none", color: "inherit", width: "100%", padding: 0, fontSize: "inherit", fontWeight: "inherit", ...style }}
      title="Install KiliGuide to your device"
    >
      <Download size={20} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
