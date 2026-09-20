"use server"; // Forced hot-reload

import https from "node:https";
import * as cheerio from "cheerio";

export async function scrapeWebpage(url: string) {
  if (!url) {
    return { error: "No URL provided." };
  }

  try {
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
    
    const title = $("title").text().trim() || "Webpage Document";
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

export const scrapeDeKut = scrapeWebpage;

export async function discoverPages(url: string) {
  if (!url) return { error: "No URL provided." };

  try {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    const parsedBase = new URL(targetUrl);
    const baseHost = parsedBase.hostname.replace(/^www\./, "");

    const agent = new https.Agent({ rejectUnauthorized: false });

    const fetchUrl = (tUrl: string, depth = 0): Promise<string> => {
      if (depth > 5) return Promise.reject(new Error("Too many redirects"));
      const parsed = new URL(tUrl);
      const isHttps = parsed.protocol === "https:";
      const lib = isHttps ? https : require("node:http");

      return new Promise((resolve, reject) => {
        lib.get(tUrl, { agent: isHttps ? agent : undefined }, (res: any) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            if (!nextUrl.startsWith("http")) nextUrl = new URL(nextUrl, tUrl).href;
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

    const html = await fetchUrl(targetUrl);
    const $ = cheerio.load(html);

    const pagesMap = new Map<string, string>();
    const rootTitle = $("title").text().trim() || "Home Page";
    pagesMap.set(targetUrl.replace(/\/$/, ""), rootTitle);

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      const rawText = $(el).text().replace(/\s+/g, " ").trim();
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const absolute = new URL(href, targetUrl).href;
        const absParsed = new URL(absolute);
        const absHost = absParsed.hostname.replace(/^www\./, "");

        if (absHost === baseHost || absHost.endsWith(`.${baseHost}`) || baseHost.endsWith(`.${absHost}`)) {
          if (/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|mp4|mp3|docx|xlsx)$/i.test(absParsed.pathname)) {
            return;
          }
          const cleanUrl = absolute.split("#")[0].replace(/\/$/, "");
          if (!pagesMap.has(cleanUrl)) {
            let title = rawText;
            if (!title || title.length < 3 || title.length > 80 || /read more|click here|link|view|more/i.test(title)) {
              title = absParsed.pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || "Page";
            }
            title = title.charAt(0).toUpperCase() + title.slice(1);
            pagesMap.set(cleanUrl, title);
          }
        }
      } catch (_) {}
    });

    const pages = Array.from(pagesMap.entries()).slice(0, 30).map(([pageUrl, title]) => ({
      title,
      url: pageUrl
    }));

    return { pages };
  } catch (err: any) {
    console.error("Discover pages error:", err);
    return { error: err.message || "Failed to discover website pages." };
  }
}
