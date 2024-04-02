import { useState } from "react";
import { CrawlSettings } from "./components/CrawlSettings";
import { SitemapButton } from "./components/SitemapButton";
import { WebsiteInput } from "./components/WebsiteInput";
import { Button } from "./components/base/Button";

export const App = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sitemapPageCount, setSitemapPageCount] = useState<number | null>(null);
  const [crawledPageCount, setCrawledPageCount] = useState<number | null>(null);
  const [discoveredUrlCount, setDiscoveredUrlCount] = useState<number | null>(null);
  const [sitemapChecked, setSitemapChecked] = useState(false);
  const [parsingSitemap, setParsingSitemap] = useState(false);
  const [isCrawlCancelled, setIsCrawlCancelled] = useState(false);
  const [showCrawlSettings, setShowCrawlSettings] = useState(false);
  const [maxRequests, setMaxRequests] = useState(20000);
  const [maxConcurrency, setMaxConcurrency] = useState(20);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);
  const [urlsToExclude, setUrlsToExclude] = useState<string[]>([]);

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

  const onCrawlProgress = (pageCount: number, discoveredUrlCount: number, isCrawlCancelled: boolean) => {
    setCrawledPageCount(pageCount);
    setDiscoveredUrlCount(discoveredUrlCount);
  };

  const handleCrawlWebsite = async () => {
    setIsCrawlCancelled(false);
    setIsCrawling(true);
    window.electronApi.on("crawl-progress", (event, pageCount: number, discoveredUrlCount: number, isCrawlCancelled: boolean) => {
      onCrawlProgress(pageCount, discoveredUrlCount, isCrawlCancelled);
    });

    const websiteUrlNoTrailingSlash = websiteUrl.endsWith("/") ? websiteUrl.slice(0, -1) : websiteUrl;
    const trimmedUrlsToExclude = urlsToExclude.map((url) => url.trim());

    const { pageCount, discoveredUrlCount, crawledUrls } = await window.electronApi.invoke(
      "crawl-website",
      websiteUrlNoTrailingSlash,
      maxRequests,
      maxConcurrency,
      trimmedUrlsToExclude
    );
    setIsCrawling(false);
    setCrawledUrls(crawledUrls);
    handleCrawlComplete(pageCount, discoveredUrlCount, crawledUrls);
  };

  const handleGenerateSitemap = () => {
    window.electronApi.send("generate-sitemap", websiteUrl, crawledUrls);
  };

  const handleCancelCrawl = () => {
    setIsCrawling(false);
    setIsCrawlCancelled(true);
    window.electronApi.send("cancel-crawl");
  };

  return (
    <>
      {showCrawlSettings ? (
        <CrawlSettings
          setShowCrawlSettings={setShowCrawlSettings}
          setMaxRequests={setMaxRequests}
          maxRequests={maxRequests}
          setMaxConcurrency={setMaxConcurrency}
          maxConcurrency={maxConcurrency}
          setUrlsToExclude={setUrlsToExclude}
          urlsToExclude={urlsToExclude}
        />
      ) : (
        <div>
          <h1 className="text-4xl text-center mb-6">Website Crawler</h1>
          <WebsiteInput value={websiteUrl} onChange={handleWebsiteInputChange} className="mb-6" />
          <SitemapButton
            websiteUrl={websiteUrl}
            onSitemapParsed={handleSitemapParsed}
            setSitemapChecked={setSitemapChecked}
            setParsingSitemap={setParsingSitemap}
            className="mb-6 mr-2"
          />
          {parsingSitemap ? <p className="mb-6">Parsing sitemap...</p> : null}
          {sitemapChecked && sitemapPageCount === null ? <p className="mb-6">No sitemaps found</p> : null}
          {sitemapPageCount !== null && sitemapChecked ? <p>Pages found in sitemap: {sitemapPageCount}</p> : null}
          <Button onClick={handleCrawlWebsite} disabled={!websiteUrl || isCrawling} className="mr-2">
            Crawl Website
          </Button>
          <Button onClick={handleGenerateSitemap} disabled={crawledUrls.length === 0} className="mr-2">
            Generate Sitemap
          </Button>
          <Button onClick={handleCancelCrawl} disabled={!isCrawling} className="mr-2">
            {isCrawlCancelled && isCrawling ? "Cancelling..." : "Cancel"}
          </Button>
          <Button onClick={() => setShowCrawlSettings(true)} className="mb-6">
            Crawl Settings
          </Button>
          {isCrawlCancelled ? <p className="mb-6">Crawl cancelled</p> : null}
          {crawledPageCount !== null ? (
            <p className="mb-6">
              Pages crawled{isCrawlCancelled ? " before cancellation" : null}: {crawledPageCount}
            </p>
          ) : null}
          {discoveredUrlCount !== null ? <p className="mb-6">URLs discovered: {discoveredUrlCount}</p> : null}
        </div>
      )}
    </>
  );
};
