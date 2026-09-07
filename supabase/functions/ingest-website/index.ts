import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { geminiFetch } from "../_shared/gemini.ts";

const CORS = { 
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" 
};
const gemini = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent";

// Helper to chunk text
function chunkText(text: string, size = 2500) {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const paragraphs = clean.split("\n\n");
  
  const chunks: string[] = [];
  let currentChunk = "";
  let activeHeader = "General Context";

  for (let i = 0; i < paragraphs.length; i++) {
    let p = paragraphs[i].trim();
    if (!p) continue;

    const isHeader = p.length < 80 && !p.match(/[.!?]$/);
    if (isHeader) {
      activeHeader = p;
    }

    let textToAppend = p;
    if (currentChunk.length === 0 && activeHeader !== "General Context" && !isHeader) {
      textToAppend = `Section Topic: ${activeHeader}\n\n${p}`;
    } else if (currentChunk.length === 0 && isHeader) {
      textToAppend = `Section Topic: ${p}`;
    }

    if (currentChunk.length + textToAppend.length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = activeHeader !== p ? `Section Topic: ${activeHeader}\n\n${p}` : `Section Topic: ${p}`;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + textToAppend;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter((chunk) => chunk.length > 80);
}

// Helper to embed text
async function embed(text: string) {
  const response = await geminiFetch(gemini, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ 
      content: { parts: [{ text: `Represent this university webpage for retrieval: ${text}` }] }, 
      output_dimensionality: 768 
    }) 
  });
  if (!response.ok) throw new Error("Embedding request failed");
  const body = await response.json();
  return (body.embedding?.values || body.embeddings?.[0]?.values) as number[];
}

// Helper to compute SHA-256 hash
async function computeHash(text: string) {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // 1. Fetch Sitemap
    const SITEMAP_URL = "https://www.dkut.ac.ke/sitemap.xml";
    console.log(`Fetching sitemap: ${SITEMAP_URL}`);
    const sitemapRes = await fetch(SITEMAP_URL);
    if (!sitemapRes.ok) throw new Error("Failed to fetch sitemap");
    const sitemapText = await sitemapRes.text();
    
    // Simple regex to extract <url><loc>...</loc><lastmod>...</lastmod></url>
    const urlsToProcess: {url: string, lastmod: string}[] = [];
    const urlRegex = /<url>\s*<loc>(.*?)<\/loc>(?:\s*<lastmod>(.*?)<\/lastmod>)?/g;
    let match;
    while ((match = urlRegex.exec(sitemapText)) !== null) {
      if (match[1].endsWith('.pdf')) continue; // Skip PDFs for edge function scraper
      urlsToProcess.push({ url: match[1], lastmod: match[2] || new Date().toISOString() });
    }
    
    console.log(`Found ${urlsToProcess.length} HTML pages in sitemap`);
    
    // 2. Fetch crawled_pages to check state
    const { data: crawledPages } = await supabase.from('crawled_pages').select('url, lastmod, content_hash');
    const crawledMap = new Map(crawledPages?.map(p => [p.url, p]) || []);
    
    // Filter to find pages that need processing
    const pendingPages = urlsToProcess.filter(p => {
      const existing = crawledMap.get(p.url);
      if (!existing) return true; // new
      // If lastmod in sitemap is newer than our recorded lastmod, it needs an update
      if (new Date(p.lastmod) > new Date(existing.lastmod)) return true;
      return false;
    });
    
    console.log(`${pendingPages.length} pages need processing.`);
    
    // 3. Batch process MAX 5 pages to avoid edge function timeout
    const batch = pendingPages.slice(0, 5);
    if (batch.length === 0) {
      return Response.json({ status: "idle", message: "No new pages to crawl" }, { headers: CORS });
    }
    
    const results = [];
    
    for (const page of batch) {
      try {
        console.log(`Crawling ${page.url}`);
        const pageRes = await fetch(page.url);
        if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status}`);
        const html = await pageRes.text();
        
        // 4. Extract clean text using Cheerio
        const $ = cheerio.load(html);
        $("script, style, noscript, header, footer, nav, aside").remove();
        const cleanText = $("body").text().replace(/\s+/g, " ").trim();
        const title = $("title").text().trim() || page.url;
        
        if (cleanText.length < 100) throw new Error("Not enough text content");
        
        const contentHash = await computeHash(cleanText);
        const existing = crawledMap.get(page.url);
        
        // If content hasn't actually changed, just update timestamp
        if (existing && existing.content_hash === contentHash) {
          await supabase.from('crawled_pages').upsert({
            url: page.url,
            lastmod: page.lastmod,
            content_hash: contentHash,
            last_crawled: new Date().toISOString(),
            status: "success"
          });
          results.push({ url: page.url, status: "skipped_unchanged" });
          continue;
        }
        
        // 5. Update/Insert Document record
        let documentId;
        const { data: docRecord } = await supabase.from('documents').select('id').eq('source_url', page.url).single();
        if (docRecord) {
          documentId = docRecord.id;
          await supabase.from('documents').update({ title, processing_status: 'extracting' }).eq('id', documentId);
        } else {
          const { data: inst } = await supabase.from('institutions').select('id').limit(1).single();
          
          const { data: newDoc, error: insertError } = await supabase.from('documents').insert({
            title,
            category: 'web',
            storage_path: 'N/A',
            file_type: 'html',
            source_url: page.url,
            processing_status: 'extracting',
            institution_id: inst?.id
          }).select('id').single();
          
          if (insertError) throw insertError;
          documentId = newDoc.id;
        }
        
        // Delete old chunks
        await supabase.from('document_chunks').delete().eq('document_id', documentId);
        
        // 6. Chunk & Embed
        const chunks = chunkText(cleanText);
        for (let i = 0; i < chunks.length; i++) {
          const enrichedChunk = `Webpage Title: ${title}\nURL: ${page.url}\n\n${chunks[i]}`;
          const { data: inserted, error: chunkErr } = await supabase.from('document_chunks').insert({
            document_id: documentId,
            content: enrichedChunk,
            chunk_index: i
          }).select('id').single();
          if (chunkErr) throw chunkErr;
          
          const vector = await embed(enrichedChunk);
          await supabase.from('embeddings').insert({ chunk_id: inserted.id, embedding: vector });
        }
        
        // Mark document as ready
        await supabase.from('documents').update({ processing_status: 'ready', chunk_count: chunks.length }).eq('id', documentId);
        
        // Record success in crawled_pages
        await supabase.from('crawled_pages').upsert({
          url: page.url,
          lastmod: page.lastmod,
          content_hash: contentHash,
          last_crawled: new Date().toISOString(),
          status: "success"
        });
        
        results.push({ url: page.url, status: "success", chunks: chunks.length });
        
      } catch (err: any) {
        console.error(`Error crawling ${page.url}: ${err.message}`);
        await supabase.from('crawled_pages').upsert({
          url: page.url,
          lastmod: page.lastmod,
          last_crawled: new Date().toISOString(),
          status: "failed"
        });
        results.push({ url: page.url, status: "failed", error: err.message });
      }
    }
    
    return Response.json({ status: "processed", count: batch.length, results }, { headers: CORS });
    
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});
