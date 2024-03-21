import { Sitemap } from "crawlee";

const sitemapUrlsToCheck = ["/sitemap_index.xml", "/sitemap.xml", "/sitemap"];

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
  try {
    for (const sitemapPath of sitemapUrlsToCheck) {
      const sitemapUrl = `${websiteUrl}${sitemapPath}`;
      const exists = await checkSitemapExists(websiteUrl, sitemapPath);

      if (exists) {
        const sitemap = await loadSitemap(sitemapUrl);

        if (sitemap) {
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
