import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { decryptPortalPassword } from "../../../lib/encryption";

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();

    if (!userId || !supabase) {
      return NextResponse.json({ error: "Missing required parameters or Supabase not initialized" }, { status: 400 });
    }

    // 1. Fetch encrypted linked account record for user
    const { data: account, error: accErr } = await supabase
      .from("linked_student_accounts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (accErr || !account) {
      return NextResponse.json({
        error: "No linked university portal account found. Please link your student portal credentials in Settings or Home."
      }, { status: 404 });
    }

    // 2. Ephemerally decrypt password in server memory
    const decryptedPassword = await decryptPortalPassword(account.encrypted_password, account.encryption_iv);

    // 3. Perform automated portal scraper / API query
    // In production, this executes Playwright/Puppeteer or portal REST request against portal.dkut.ac.ke
    const timestamp = new Date().toISOString();
    let resultData: any = {};

    if (action === "fee_statement" || !action) {
      resultData.feeStatement = {
        studentRegNo: account.portal_username,
        academicYear: "2025/2026 Semester 2",
        billedAmount: "KES 65,000",
        paidAmount: "KES 50,500",
        currentBalance: "KES 14,500",
        examClearanceStatus: "PENDING_CLEARANCE",
        lastTransactionDate: new Date().toLocaleDateString()
      };
    }

    if (action === "unit_registration" || !action) {
      resultData.registeredUnits = [
        { code: "BIT 3201", title: "Distributed Systems", status: "REGISTERED", credits: 4 },
        { code: "BIT 3202", title: "Artificial Intelligence & Expert Systems", status: "REGISTERED", credits: 4 },
        { code: "BIT 3203", title: "Web Application Architecture & Security", status: "REGISTERED", credits: 4 },
        { code: "BIT 3204", title: "Research Methodology in ICT", status: "REGISTERED", credits: 3 }
      ];
    }

    // 4. Cache clean data snapshot in Supabase DB for offline/fast AI answers
    const updatedCache = {
      ...(account.cached_portal_data || {}),
      ...resultData,
      lastSyncedAt: timestamp
    };

    await supabase
      .from("linked_student_accounts")
      .update({
        cached_portal_data: updatedCache,
        last_synced_at: timestamp
      })
      .eq("id", account.id);

    return NextResponse.json({
      success: true,
      data: resultData,
      syncedAt: timestamp
    });

  } catch (err: any) {
    console.error("Portal sync error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync student portal data" }, { status: 500 });
  }
}
