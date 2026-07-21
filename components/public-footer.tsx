"use client";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 0", marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#8e8ea0", fontSize: 13 }}>
      <div>© {new Date().getFullYear()} KiliGuide. Built for DeKUT.</div>
      <div style={{ display: "flex", gap: 24 }}>
        <Link href="/privacy" style={{ background: "none", border: "none", color: "#8e8ea0", cursor: "pointer", padding: 0, textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#8e8ea0"}>Privacy Policy</Link>
        <Link href="/terms" style={{ background: "none", border: "none", color: "#8e8ea0", cursor: "pointer", padding: 0, textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#8e8ea0"}>Terms of Use</Link>
      </div>
    </footer>
  );
}
