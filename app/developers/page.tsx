"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// SwaggerUI does not support SSR, so we load it dynamically
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false, loading: () => <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading API documentation...</div> });

export default function DevelopersPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link href="/" style={{ color: "#888", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <div style={{ height: 24, width: 1, background: "#333" }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>KiliGuide Developer API</h1>
        </div>

        {/* Swagger Container (forced white background because swagger-ui default CSS is light) */}
        <div style={{ background: "#ffffff", borderRadius: 12, overflow: "hidden", padding: "20px 0", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          <SwaggerUI url="/openapi.yaml" />
        </div>
        
      </div>
    </main>
  );
}
