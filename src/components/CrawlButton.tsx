import { useState } from "react";

interface CrawlButtonProps {
  websiteUrl: string;
  onCrawlProgress: (pageCount: number, discoveredUrlCount: number) => void;
  onCrawlComplete: (pageCount: number, discoveredUrlCount: number, crawledUrls: string[]) => void;
}

export const CrawlButton = ({ websiteUrl, onCrawlProgress, onCrawlComplete }: CrawlButtonProps) => {
  const [maxRequests, setMaxRequests] = useState(1000);
  const [maxConcurrency, setMaxConcurrency] = useState(10);

  const handleClick = async () => {
    window.electronApi.on("crawl-progress", (event, pageCount: number, discoveredUrlCount: number) => {
      onCrawlProgress(pageCount, discoveredUrlCount);
    });

    const { pageCount, discoveredUrlCount, crawledUrls } = await window.electronApi.invoke("crawl-website", websiteUrl, maxRequests, maxConcurrency);
    onCrawlComplete(pageCount, discoveredUrlCount, crawledUrls);
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
    </div>
  );
};
