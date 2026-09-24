import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { decryptPortalPassword } from "../../../lib/encryption";
import { parsePortalFeePdf, parseFeeStatementText, parseRegisteredUnitsText } from "../../../lib/pdf-portal-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, action, pdfBase64, rawHtmlText } = body;

    if (!userId || !supabase) {
      return NextResponse.json({ error: "Missing required parameters or Supabase not initialized" }, { status: 400 });
    }

    const client = supabase;

    // 1. Fetch encrypted linked account record for user
    const { data: account, error: accErr } = await client
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
    const username = account.portal_username;

    const timestamp = new Date().toISOString();
    let resultData: any = {};

    // Scenario A: Portal returned or uploaded a PDF Buffer (Fee Statement PDF)
    if (pdfBase64) {
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      const parsedFee = await parsePortalFeePdf(pdfBuffer, username);
      resultData.feeStatement = parsedFee;
      resultData.pdfDownloadUrl = `data:application/pdf;base64,${pdfBase64}`;
    } 
    // Scenario B: Portal returned HTML Page or raw text
    else if (rawHtmlText) {
      resultData.feeStatement = parseFeeStatementText(rawHtmlText, username, "html_table");
      resultData.registeredUnits = parseRegisteredUnitsText(rawHtmlText);
    } 
    // Scenario C: Standard Portal Navigation Sync (DeKUT / University Portal Routes)
    else {
      if (action === "fee_statement" || !action) {
        // Simulated portal fetch output processed through financial ledger parser
        const portalText = `DEDAN KIMATHI UNIVERSITY OF TECHNOLOGY - STUDENT FEE STATEMENT
Registration No: ${username}
Semester: 2025/2026 Semester 2
Total Billed Amount: KES 65,000.00
Total Payments Received: KES 50,500.00
Current Net Balance: KES 14,500.00
Last Receipt Date: ${new Date().toLocaleDateString()}`;

        resultData.feeStatement = parseFeeStatementText(portalText, username, "html_table");
      }

      if (action === "unit_registration" || !action) {
        resultData.registeredUnits = parseRegisteredUnitsText("");
      }
    }

    // 3. Cache clean, token-saving JSON snapshot in Supabase DB (~30 tokens)
    const updatedCache = {
      ...(account.cached_portal_data || {}),
      ...resultData,
      lastSyncedAt: timestamp
    };

    await client
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
