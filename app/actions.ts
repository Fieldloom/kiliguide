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

function deriveOfficialTitleFromEmail(email: string, scrapedLabel?: string): string {
  const genericWords = [
    "address", "email", "tel", "tel no", "phone", "telephone", "contact", "contacts",
    "fax", "n/a", "info", "details", "location", "po box", "p.o. box", "p o box",
    "website", "mobile", "cell", "reg", "link", "click here", "webmaster"
  ];

  const cleanLabel = (scrapedLabel || "").trim().replace(/\s+/g, " ");
  const labelLower = cleanLabel.toLowerCase();

  // If scraped label is valid and NOT generic, return it!
  if (
    cleanLabel.length >= 4 &&
    cleanLabel.length <= 80 &&
    !genericWords.some(w => labelLower === w || labelLower.startsWith(w + " ") || labelLower.endsWith(" " + w)) &&
    !/^\d+$/.test(cleanLabel)
  ) {
    return cleanLabel;
  }

  // Derive title from email address prefix
  const prefix = email.split("@")[0].toLowerCase().trim();

  // Dictionary of known university email prefixes
  const knownDict: Record<string, string> = {
    "execdean-arts": "Executive Dean, Faculty of Arts",
    "execdean-business": "Executive Dean, Faculty of Business",
    "execdean-fagric": "Executive Dean, Faculty of Agriculture",
    "execdean-fbe": "Executive Dean, Faculty of Built Environment",
    "execdean-fed": "Executive Dean, Faculty of Education",
    "execdean-feng": "Executive Dean, Faculty of Engineering",
    "execdean-fhs": "Executive Dean, Faculty of Health Sciences",
    "execdean-fss": "Executive Dean, Faculty of Social Sciences",
    "execdean-fst": "Executive Dean, Faculty of Science & Technology",
    "execdean-law": "Executive Dean, Faculty of Law",
    "execdean-vet": "Executive Dean, Faculty of Veterinary Medicine",
    "reg-academic": "Academic Registrar's Office",
    "reg-admin": "Administration & HR Registrar",
    "admissions": "Admissions Department",
    "pg-admissions": "Postgraduate Admissions Office",
    "pg": "Postgraduate Studies Department",
    "pr": "Public Relations & Corporate Communications",
    "ict": "ICT & Digital Services",
    "vc": "Office of the Vice-Chancellor",
    "dvc-academic": "Deputy Vice-Chancellor (Academic Affairs)",
    "dvc-rio": "Deputy Vice-Chancellor (Research, Innovation & Extension)",
    "dvc-afd": "Deputy Vice-Chancellor (Administration, Finance & Development)",
    "finance": "Finance & Accounts Office",
    "deanofstudents": "Dean of Students Office",
    "library": "University Library Services",
    "accommodation": "Student Accommodation & Hostels Office",
    "sports": "Sports & Games Department",
    "security": "Campus Security & Safety Office",
    "health": "University Health Services & Clinic",
  };

  if (knownDict[prefix]) {
    return knownDict[prefix];
  }

  // Smart regex / string expansion for email prefixes
  let derived = prefix
    .replace(/^execdean[-_]/, "Executive Dean, ")
    .replace(/^dean[-_]/, "Dean, ")
    .replace(/^reg[-_]/, "Registrar, ")
    .replace(/^dvc[-_]/, "Deputy Vice Chancellor, ")
    .replace(/^vc[-_]/, "Vice Chancellor, ")
    .replace(/^hod[-_]/, "Head of Department, ")
    .replace(/^dept[-_]/, "Department of ")
    .replace(/[-_]fagric$/, " (Faculty of Agriculture)")
    .replace(/[-_]fbe$/, " (Faculty of Built Environment)")
    .replace(/[-_]fed$/, " (Faculty of Education)")
    .replace(/[-_]feng$/, " (Faculty of Engineering)")
    .replace(/[-_]fhs$/, " (Faculty of Health Sciences)")
    .replace(/[-_]fss$/, " (Faculty of Social Sciences)")
    .replace(/[-_]fst$/, " (Faculty of Science & Technology)")
    .replace(/[-_]vet$/, " (Faculty of Veterinary Medicine)")
    .replace(/[-_]arts$/, " (Faculty of Arts)")
    .replace(/[-_]law$/, " (Faculty of Law)")
    .replace(/[-_]/g, " ");

  // Title case words
  derived = derived
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (derived.length < 3) {
    derived = email.split("@")[0].toUpperCase() + " Department";
  }

  return derived;
}

export async function discoverDepartmentContacts(urlOrDomain: string) {
  if (!urlOrDomain || !urlOrDomain.trim()) {
    return { error: "No URL or domain provided." };
  }

  try {
    let clean = urlOrDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const baseDomain = clean.replace(/^www\./, "");
    const targetUrl = `https://www.${baseDomain}/`;

    const agent = new https.Agent({ rejectUnauthorized: false });

    const fetchHtml = (tUrl: string, depth = 0): Promise<string> => {
      if (depth > 4) return Promise.reject(new Error("Too many redirects"));
      const parsed = new URL(tUrl);
      const isHttps = parsed.protocol === "https:";
      const lib = isHttps ? https : require("node:http");

      return new Promise((resolve) => {
        const req = lib.get(tUrl, { agent: isHttps ? agent : undefined, timeout: 7000 }, (res: any) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            if (!nextUrl.startsWith("http")) nextUrl = new URL(nextUrl, tUrl).href;
            return resolve(fetchHtml(nextUrl, depth + 1));
          }
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 400)) {
            return resolve("");
          }
          let data = "";
          res.on("data", (chunk: any) => data += chunk);
          res.on("end", () => resolve(data));
        });
        req.on("error", () => resolve(""));
        req.on("timeout", () => { req.destroy(); resolve(""); });
      });
    };

    // Scrape homepage and standard contact paths
    const candidatePaths = ["", "contacts", "contact-us", "departments", "directory", "about-us"];
    const htmlPromises = candidatePaths.map(p => fetchHtml(p ? `https://www.${baseDomain}/${p}` : targetUrl));
    const rawHtmlResults = await Promise.all(htmlPromises);

    const contactsMap = new Map<string, { name: string; code: string; contact_email: string; contact_phone?: string; source_url: string }>();

    candidatePaths.forEach((path, idx) => {
      const html = rawHtmlResults[idx];
      if (!html) return;
      const currentUrl = path ? `https://www.${baseDomain}/${path}` : targetUrl;
      const $ = cheerio.load(html);

      // 1. Extract mailto: links
      $("a[href^='mailto:']").each((_, el) => {
        const mailtoHref = $(el).attr("href") || "";
        const email = mailtoHref.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
        if (email && email.includes("@") && !contactsMap.has(email)) {
          let label = $(el).text().replace(/\s+/g, " ").trim();
          if (!label || label.toLowerCase().includes(email) || label.length < 3) {
            label = $(el).closest("tr, li, div, p").find("h1, h2, h3, h4, h5, th, strong, b").first().text().replace(/\s+/g, " ").trim();
            if (!label) {
              label = $(el).closest("tr, li, div, p").text().replace(/\s+/g, " ").trim();
              label = label.split(/[:\n|-]/)[0].trim();
            }
          }
          const officialName = deriveOfficialTitleFromEmail(email, label);
          const code = officialName.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "DEPT";
          contactsMap.set(email, { name: officialName, code, contact_email: email, source_url: currentUrl });
        }
      });

      // 2. Extract emails from text via regex
      const text = $("body").text();
      const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      emailMatches.forEach(email => {
        const cleanEmail = email.toLowerCase().trim();
        if (cleanEmail.endsWith(".png") || cleanEmail.endsWith(".jpg") || cleanEmail.endsWith(".js") || cleanEmail.endsWith(".css")) return;
        if (!contactsMap.has(cleanEmail)) {
          const officialName = deriveOfficialTitleFromEmail(cleanEmail);
          const code = officialName.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "GEN";
          contactsMap.set(cleanEmail, { name: officialName, code, contact_email: cleanEmail, source_url: currentUrl });
        }
      });
    });

    const contacts = Array.from(contactsMap.values()).slice(0, 20);
    return { contacts };
  } catch (err: any) {
    console.error("Discover contacts error:", err);
    return { error: err.message || "Failed to discover department contacts." };
  }
}
