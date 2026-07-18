import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !documents || documents.length === 0) {
      return Response.json({ error: "Failed to fetch document", details: error }, { headers: CORS });
    }

    const doc = documents[0];

    // Now call process-document just like the UI does!
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id, storagePath: doc.storage_path, extension: doc.file_type })
    });

    const body = await res.text();
    
    return Response.json({ 
      document: doc, 
      process_status: res.status, 
      process_body: body 
    }, { headers: CORS });
    
  } catch (err: any) {
    return Response.json({ error: err.stack }, { status: 500, headers: CORS });
  }
});
