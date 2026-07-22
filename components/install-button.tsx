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

  return (
    <button 
      onClick={async () => {
        if (!deferredPrompt) {
          // If the prompt isn't available, we show a helpful alert explaining how to manually install
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
          if (isIOS) {
            alert("To install KiliGuide on iOS: Tap the 'Share' button at the bottom of Safari, then scroll down and tap 'Add to Home Screen'.");
          } else {
            alert("App installation is not supported by your current browser, or it's already installed. Look for an 'Install' icon in your URL address bar to install manually!");
          }
          return;
        }
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
