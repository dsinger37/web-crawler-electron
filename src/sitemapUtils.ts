import { Sitemap } from "crawlee";
import { XMLParser } from "fast-xml-parser";

async function countUrlsInSitemap(sitemapUrl: string): Promise<number> {
  const response = await fetch(sitemapUrl);
  const xmlData = await response.text();

  const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "",
  };
  const parser = new XMLParser(parserOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }

  const jsonObj = parser.parse(xmlData);

  if (!jsonObj.urlset || !jsonObj.urlset.url) {
    console.error("Invalid sitemap format");
    return 0;
  }

  return Array.isArray(jsonObj.urlset.url) ? jsonObj.urlset.url.length : 1;
}

async function checkSitemapExists(baseUrl: string, sitemapPath: string): Promise<boolean> {
  const url = `${baseUrl}${sitemapPath}`;
  const response = await fetch(url, { method: "HEAD" });
  return response.ok;
}

// Crawlee will automatically handle parsing sitemaps from inside sitemap indexes so we only need to load the sitemap
async function loadSitemap(url: string): Promise<Sitemap | null> {
  try {
    return await Sitemap.load(url);
  } catch (error) {
    console.error(`Error loading sitemap from ${url}:`, error);
    return null;
  }
}

export async function checkAndParseSitemap(websiteUrl: string): Promise<number> {
  const sitemapUrlsToCheck = ["/sitemap_index.xml", "/sitemap.xml", "/sitemap"];
  try {
    for (const sitemapPath of sitemapUrlsToCheck) {
      const sitemapUrl = `${websiteUrl}${sitemapPath}`;
      const exists = await checkSitemapExists(websiteUrl, sitemapPath);

      if (exists) {
        const sitemap = await loadSitemap(sitemapUrl);

        if (sitemap) {
          // Sometimes Crawlee will not parse the sitemap correctly, so we need to check if it has any URLs
          if (sitemap.urls.length === 0) {
            return countUrlsInSitemap(sitemapUrl);
          }
          return sitemap.urls.length;
        }
      }
    }

    throw new Error("No sitemap found");
  } catch (error) {
    console.error("Error checking and parsing sitemap:", error);
    return null;
  }
}
