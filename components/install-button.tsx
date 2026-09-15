"use client";
import { useState, useEffect } from "react";
import { Download, CheckCircle2 } from "lucide-react";

export function InstallButton({ 
  className, 
  style, 
  label = "Install App", 
  collapsed = false 
}: { 
  className?: string; 
  style?: React.CSSProperties; 
  label?: string; 
  collapsed?: boolean; 
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running as PWA standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (standalone) {
      setIsStandalone(true);
    }

    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (isStandalone) {
      alert("KiliGuide is already installed on your device!");
      return;
    }

    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          (window as any).deferredInstallPrompt = null;
          setIsStandalone(true);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
      return;
    }

    // Fallback detection for iOS or custom browsers
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      alert("To install KiliGuide on iOS:\n\n1. Tap the 'Share' button in Safari (bottom bar).\n2. Scroll down and tap 'Add to Home Screen'.");
    } else {
      alert("To install KiliGuide:\n\nTap your browser's menu (three dots at top right) and select 'Install App' or 'Add to Home Screen'.");
    }
  };

  return (
    <button 
      onClick={handleInstallClick}
      className={className}
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 10, 
        cursor: "pointer", 
        background: "transparent", 
        border: "none", 
        color: "inherit", 
        width: "100%", 
        padding: 0, 
        fontSize: "inherit", 
        fontWeight: "inherit", 
        ...style 
      }}
      title="Install KiliGuide app to home screen"
    >
      {isStandalone ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Download size={18} />}
      {!collapsed && <span>{isStandalone ? "App Installed" : label}</span>}
    </button>
  );
}
