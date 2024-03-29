import { useState } from "react";
import { CrawlButton } from "./components/CrawlButton";
import { SitemapButton } from "./components/SitemapButton";
import { WebsiteInput } from "./components/WebsiteInput";

export const App = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sitemapPageCount, setSitemapPageCount] = useState<number | null>(null);
  const [crawledPageCount, setCrawledPageCount] = useState<number | null>(null);
  const [discoveredUrlCount, setDiscoveredUrlCount] = useState<number | null>(null);
  const [sitemapChecked, setSitemapChecked] = useState(false);
  const [parsingSitemap, setParsingSitemap] = useState(false);
  const [isCrawlCancelled, setIsCrawlCancelled] = useState(false);

  const handleWebsiteInputChange = (url: string) => {
    setWebsiteUrl(url);
  };

  const handleSitemapParsed = (pageCount: number) => {
    setSitemapPageCount(pageCount);
    setSitemapChecked(true);
  };

  const handleCrawlComplete = (pageCount: number, discoveredUrlCount: number, crawledUrls: string[]) => {
    setCrawledPageCount(pageCount);
    setDiscoveredUrlCount(discoveredUrlCount);
  };

  const onCrawlProgress = (pageCount: number, discoveredUrlCount: number) => {
    setCrawledPageCount(pageCount);
    setDiscoveredUrlCount(discoveredUrlCount);
  };

  return (
    <div>
      <h1 className="text-4xl text-center mb-6">Website Crawler</h1>
      <WebsiteInput value={websiteUrl} onChange={handleWebsiteInputChange} className="mb-6" />
      <SitemapButton websiteUrl={websiteUrl} onSitemapParsed={handleSitemapParsed} setSitemapChecked={setSitemapChecked} setParsingSitemap={setParsingSitemap} className="mb-6" />
      {parsingSitemap ? <p className="mb-6">Parsing sitemap...</p> : null}
      {sitemapPageCount !== null && sitemapChecked ? <p>Pages found in sitemap: {sitemapPageCount}</p> : null}
      <CrawlButton
        websiteUrl={websiteUrl}
        onCrawlComplete={handleCrawlComplete}
        onCrawlProgress={onCrawlProgress}
        isCrawlCancelled={isCrawlCancelled}
        setIsCrawlCancelled={setIsCrawlCancelled}
        className="mb-6 mt-10"
      />
      {sitemapChecked && sitemapPageCount === null ? <p className="mb-6">No sitemaps found</p> : null}
      {isCrawlCancelled ? <p className="mb-6">Crawl cancelled</p> : null}
      {crawledPageCount !== null ? (
        <p className="mb-6">
          Pages crawled{isCrawlCancelled ? " before cancellation" : null}: {crawledPageCount}
        </p>
      ) : null}
      {discoveredUrlCount !== null ? <p className="mb-6">URLs discovered: {discoveredUrlCount}</p> : null}
    </div>
  );
};
