"use server";

import https from "node:https";
import * as cheerio from "cheerio";

export async function scrapeDeKut(url: string) {
  if (!url) {
    return { error: "No URL provided." };
  }


  try {
    // Custom HTTPS agent to bypass missing intermediate certs on DeKUT's server
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const fetchUrl = (targetUrl: string, depth = 0): Promise<string> => {
      if (depth > 5) return Promise.reject(new Error("Too many redirects"));
      
      const parsedUrl = new URL(targetUrl);
      const isHttps = parsedUrl.protocol === "https:";
      const lib = isHttps ? https : require("node:http");
      
      return new Promise((resolve, reject) => {
        lib.get(targetUrl, { agent: isHttps ? agent : undefined }, (res: any) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            if (!nextUrl.startsWith("http")) nextUrl = new URL(nextUrl, targetUrl).href;
            return resolve(fetchUrl(nextUrl, depth + 1));
          }
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 400)) {
            return reject(new Error(`Server returned status code ${res.statusCode}`));
          }
          let data = "";
          res.on("data", (chunk: any) => data += chunk);
          res.on("end", () => resolve(data));
        }).on("error", reject);
      });
    };

    const html = await fetchUrl(url);

    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $("nav, footer, script, style, noscript, header, .navbar, .footer").remove();
    
    const title = $("title").text().trim() || "DeKUT Page";
    const text = $("body").text().replace(/\s+/g, " ").trim();

    if (!text || text.length < 50) {
      return { error: "Could not extract meaningful content from the page." };
    }

    return { title, text };
  } catch (err: any) {
    console.error("Scraping error:", err);
    return { error: err.message || "Failed to scrape the website." };
  }
}
