import { useState } from "react";
import { Button } from "./base/Button";
import { Input } from "./base/Input";

interface CrawlButtonProps {
  websiteUrl: string;
  onCrawlProgress: (pageCount: number, discoveredUrlCount: number, isCrawlCancelled: boolean) => void;
  onCrawlComplete: (pageCount: number, discoveredUrlCount: number, crawledUrls: string[]) => void;
  isCrawlCancelled: boolean;
  setIsCrawlCancelled: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

export const CrawlButton = ({ websiteUrl, onCrawlProgress, onCrawlComplete, isCrawlCancelled, setIsCrawlCancelled, className }: CrawlButtonProps) => {
  const [maxRequests, setMaxRequests] = useState(10000);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);

  const handleClick = async () => {
    setIsCrawlCancelled(false);
    setIsCrawling(true);
    window.electronApi.on("crawl-progress", (event, pageCount: number, discoveredUrlCount: number, isCrawlCancelled: boolean) => {
      onCrawlProgress(pageCount, discoveredUrlCount, isCrawlCancelled);
    });

    const { pageCount, discoveredUrlCount, crawledUrls } = await window.electronApi.invoke("crawl-website", websiteUrl, maxRequests, maxConcurrency);
    setIsCrawling(false);
    setCrawledUrls(crawledUrls);
    onCrawlComplete(pageCount, discoveredUrlCount, crawledUrls);
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
    <div className={className}>
      <h2 className="text-center text-2xl mb-5">Crawl Settings</h2>
      <div className="flex space-x-5">
      <label>
        Max Requests:
        <Input type="number" value={maxRequests} onChange={(e) => setMaxRequests(Number(e.target.value))} className="mb-6 mt-2" />
      </label>
      <label>
        Max Concurrency:
        <Input type="number" value={maxConcurrency} onChange={(e) => setMaxConcurrency(Number(e.target.value))} className="mb-6 mt-2" />
      </label>
      </div>
      <Button onClick={handleClick} disabled={!websiteUrl || isCrawling} className="mr-2">
        Crawl Website
      </Button>
      <Button onClick={handleGenerateSitemap} disabled={crawledUrls.length === 0} className="mr-2">
        Generate Sitemap
      </Button>
      <Button onClick={handleCancel} disabled={!isCrawling}>
        {isCrawlCancelled && isCrawling ? "Cancelling..." : "Cancel"}
      </Button>
    </div>
  );
};
