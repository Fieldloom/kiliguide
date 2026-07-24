import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ──────────────────────────────────────────────
// URL whitelist: only crawl these path patterns
// ──────────────────────────────────────────────
const ALLOWED_PATH_PATTERNS = [
  /^\/academics\//i,
  /^\/admissions\//i,
  /^\/fee[-_]?structure/i,
  /^\/fees\//i,
  /^\/students\//i,
  /^\/student[-_]?affairs\//i,
  /^\/notices\//i,
  /^\/news\//i,
  /^\/announcements\//i,
  /^\/departments?\//i,
  /^\/school(s)?\//i,
  /^\/faculty\//i,
  /^\/library\//i,
  /^\/research\//i,
  /^\/about\//i,
  /^\/contact(s)?\//i,
  /^\/hostel\//i,
  /^\/services\//i,
  /^\/graduation\//i,
  /^\/examination(s)?\//i,
  /^\/timetable\//i,
  /^\/calendar\//i,
  /^\/staff\//i,
];

// File extensions to skip
const SKIP_EXTENSIONS = /\.(docx|doc|xlsx|pptx|jpg|jpeg|png|gif|svg|mp4|zip|rar|exe)$/i;

// Domains we are allowed to crawl
const TRUSTED_DOMAINS = ["dkut.ac.ke", "www.dkut.ac.ke", "dkut.edu.ke", "www.dkut.edu.ke"];

// ──────────────────────────────────────────────
// Parse sitemap XML and extract all URLs
// ──────────────────────────────────────────────
function extractUrlsFromSitemap(xml: string): string[] {
  const urls: string[] = [];
  // Match both <loc> tags from page sitemaps and nested <sitemap> index files
  const locMatches = xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi);
  for (const match of locMatches) {
    urls.push(match[1].trim());
  }
  return urls;
}

// ──────────────────────────────────────────────
// Determine if a URL should be crawled
// ──────────────────────────────────────────────
function shouldCrawl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Skip file downloads
    if (SKIP_EXTENSIONS.test(parsed.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
// Fetch and parse a sitemap (handles index + page sitemaps)
// ──────────────────────────────────────────────
async function fetchAllSitemapUrls(rootSitemapUrl: string): Promise<string[]> {
  const allUrls = new Set<string>();
  const sitemapsToProcess = [rootSitemapUrl];
  const processedSitemaps = new Set<string>();

  while (sitemapsToProcess.length > 0) {
    const sitemapUrl = sitemapsToProcess.pop()!;
    if (processedSitemaps.has(sitemapUrl)) continue;
    processedSitemaps.add(sitemapUrl);

    try {
      console.log(`Fetching sitemap: ${sitemapUrl}`);
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": "KiliGuide-Crawler/1.0 (university-knowledge-indexer)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        console.warn(`Sitemap fetch failed: ${sitemapUrl} (${res.status})`);
        continue;
      }
      const xml = await res.text();
      const urls = extractUrlsFromSitemap(xml);

      for (const url of urls) {
        // If URL points to another sitemap, recurse into it
        if (url.includes("sitemap") && (url.endsWith(".xml") || url.includes("sitemap_"))) {
          sitemapsToProcess.push(url);
        } else {
          allUrls.add(url);
        }
      }
    } catch (e: any) {
      console.warn(`Error processing sitemap ${sitemapUrl}:`, e.message || "Timeout");
    }
  }

  return [...allUrls];
}

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Allow both: internal cron calls (no auth header) and admin user calls
  const authorization = req.headers.get("Authorization");
  if (authorization) {
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authorization } } },
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
    // Check admin role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["administrator", "super_admin", "dept_admin"])
      .maybeSingle();
    if (!roleRow) return Response.json({ error: "Admin access required." }, { status: 403, headers: CORS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "discover"; // "discover" | "crawl" | "full"
    const maxCrawl = Math.min(body.max ?? 20, 50); // cap at 50 per call to stay fast

    // ── STEP 1: DISCOVER ──────────────────────────────────────────────
    // Fetch all sitemaps and add newly discovered URLs to the queue
    const SITEMAP_ROOT = "https://www.dkut.ac.ke/sitemap.xml";
    let discovered = 0;
    let filtered = 0;

    if (mode === "discover" || mode === "full") {
      const allUrls = await fetchAllSitemapUrls(SITEMAP_ROOT);
      console.log(`Sitemap discovery: ${allUrls.length} total URLs found`);

      const filteredUrls = allUrls.filter(shouldCrawl);
      filtered = filteredUrls.length;
      console.log(`After filtering: ${filtered} URLs eligible for crawling`);

      // Insert new URLs (ignore duplicates via ON CONFLICT DO NOTHING)
      for (const url of filteredUrls) {
        const domain = new URL(url).hostname;
        const { error } = await supabase
          .from("crawl_queue")
          .insert({ url, domain, status: "pending" })
          .onConflict("url")
          .ignore();
        if (!error) discovered++;
      }
    }

    // ── STEP 2: CRAWL ─────────────────────────────────────────────────
    // Process pending URLs from the queue, calling ingest-official-source for each
    let crawled = 0;
    let failed = 0;

    if (mode === "crawl" || mode === "full") {
      // Get pending items that haven't been retried too many times
      const { data: pending } = await supabase
        .from("crawl_queue")
        .select("id, url")
        .eq("status", "pending")
        .lt("retry_count", 3)
        .order("discovered_at", { ascending: true })
        .limit(maxCrawl);

      console.log(`Processing ${pending?.length ?? 0} pending URLs`);

      // Process concurrently, 3 at a time
      const queue = [...(pending ?? [])];
      const CONCURRENCY = 3;

      while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENCY);
        await Promise.all(batch.map(async ({ id, url }) => {
          // Mark as crawling
          await supabase.from("crawl_queue").update({ status: "crawling" }).eq("id", id);

          try {
            const ingestRes = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/ingest-official-source`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({ url, internal: true }),
              },
            );

            const result = await ingestRes.json();

            if (ingestRes.ok && result.documentId) {
              await supabase.from("crawl_queue").update({
                status: "done",
                document_id: result.documentId,
                last_crawled_at: new Date().toISOString(),
                error: null,
              }).eq("id", id);
              crawled++;
            } else {
              throw new Error(result.error ?? "Ingest failed with no error message");
            }
          } catch (e: any) {
            console.error(`Failed to crawl ${url}:`, e.message);
            await supabase.from("crawl_queue").update({
              status: "failed",
              error: e.message?.slice(0, 500),
              last_crawled_at: new Date().toISOString(),
              retry_count: supabase.rpc("increment_retry", { row_id: id }), // increments in DB
            }).eq("id", id);
            failed++;
          }
        }));
      }
    }

    // ── RESPONSE ──────────────────────────────────────────────────────
    const { count: totalDone } = await supabase
      .from("crawl_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "done");

    const { count: totalPending } = await supabase
      .from("crawl_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return Response.json({
      mode,
      discovered,
      filtered,
      crawled,
      failed,
      total_indexed: totalDone ?? 0,
      total_pending: totalPending ?? 0,
      message: `Crawl complete. ${crawled} pages ingested, ${failed} failed. ${totalPending ?? 0} still pending.`,
    }, { headers: CORS });

  } catch (error: any) {
    console.error("crawl-sitemap failed:", error.message);
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});
