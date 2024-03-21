import { useState } from "react";
import { CrawlButton } from "./components/CrawlButton";
import { SitemapButton } from "./components/SitemapButton";
import { WebsiteInput } from "./components/WebsiteInput";

export const App = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sitemapPageCount, setSitemapPageCount] = useState<number | null>(null);
  const [crawledPageCount, setCrawledPageCount] = useState<number | null>(null);
  const [discoveredUrlCount, setDiscoveredUrlCount] = useState<number | null>(null);

  const handleWebsiteInputChange = (url: string) => {
    setWebsiteUrl(url);
  };

  const handleSitemapParsed = (pageCount: number) => {
    setSitemapPageCount(pageCount);
  };

  const handleCrawlComplete = (pageCount: number, discoveredUrlCount: number, crawledUrls: string[]) => {
    setCrawledPageCount(pageCount);
    setDiscoveredUrlCount(discoveredUrlCount);
    console.log("Crawled Urls", crawledUrls);
  };

  const onCrawlProgress = (pageCount: number, discoveredUrlCount: number) => {
    setCrawledPageCount(pageCount);
    setDiscoveredUrlCount(discoveredUrlCount);
  };

  return (
    <div>
      <h1>Website Crawler</h1>
      <WebsiteInput value={websiteUrl} onChange={handleWebsiteInputChange} />
      <SitemapButton websiteUrl={websiteUrl} onSitemapParsed={handleSitemapParsed} />
      <CrawlButton websiteUrl={websiteUrl} onCrawlComplete={handleCrawlComplete} onCrawlProgress={onCrawlProgress} />
      {sitemapPageCount !== null ? <p>Pages found in sitemap: {sitemapPageCount}</p> : <p>No sitemaps found</p>}
      {crawledPageCount !== null ? <p>Pages crawled: {crawledPageCount}</p> : null}
      {discoveredUrlCount !== null ? <p>URLs discovered: {discoveredUrlCount}</p> : null}
    </div>
  );
};
