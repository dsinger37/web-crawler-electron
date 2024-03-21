import { useState } from "react";

interface CrawlButtonProps {
  websiteUrl: string;
  onCrawlProgress: (pageCount: number, discoveredUrlCount: number, isCrawlCancelled: boolean) => void;
  onCrawlComplete: (pageCount: number, discoveredUrlCount: number, crawledUrls: string[]) => void;
}

export const CrawlButton = ({ websiteUrl, onCrawlProgress, onCrawlComplete }: CrawlButtonProps) => {
  const [maxRequests, setMaxRequests] = useState(1000);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isCrawlCancelled, setIsCrawlCancelled] = useState(false);
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);

  const handleClick = async () => {
    setIsCrawling(true);
    window.electronApi.on("crawl-progress", (event, pageCount: number, discoveredUrlCount: number, isCrawlCancelled: boolean) => {
      onCrawlProgress(pageCount, discoveredUrlCount, isCrawlCancelled);
    });

    const { pageCount, discoveredUrlCount, crawledUrls } = await window.electronApi.invoke("crawl-website", websiteUrl, maxRequests, maxConcurrency);
    setCrawledUrls(crawledUrls);
    onCrawlComplete(pageCount, discoveredUrlCount, crawledUrls);
    setIsCrawlCancelled(false);
  };

    const handleGenerateSitemap = () => {
    window.electronApi.send("generate-sitemap", websiteUrl, crawledUrls);
  };

  const handleCancel = () => {
    setIsCrawling(false);
    setIsCrawlCancelled(true);
    window.electronApi.send("cancel-crawl");
  };

  return (
    <div>
      <label>
        Max Requests:
        <input type="number" value={maxRequests} onChange={(e) => setMaxRequests(Number(e.target.value))} />
      </label>
      <label>
        Max Concurrency:
        <input type="number" value={maxConcurrency} onChange={(e) => setMaxConcurrency(Number(e.target.value))} />
      </label>
      <button onClick={handleClick}>Crawl Website</button>
      <button onClick={handleGenerateSitemap} disabled={crawledUrls.length === 0}>
        Generate Sitemap
      </button>
      <button onClick={handleCancel} disabled={!isCrawling}>
        {isCrawlCancelled ? "Cancelling..." : "Cancel"}
      </button>
    </div>
  );
};
