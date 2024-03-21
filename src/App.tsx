import { useState } from "react";
import { SitemapButton } from "./components/SitemapButton";
import { WebsiteInput } from "./components/WebsiteInput";

export const App = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sitemapPageCount, setSitemapPageCount] = useState<number | null>(null);

  const handleWebsiteInputChange = (url: string) => {
    setWebsiteUrl(url);
  };

  const handleSitemapParsed = (pageCount: number) => {
    setSitemapPageCount(pageCount);
  };

  return (
    <div>
      <h1>Website Crawler</h1>
      <WebsiteInput value={websiteUrl} onChange={handleWebsiteInputChange} />
      <SitemapButton websiteUrl={websiteUrl} onSitemapParsed={handleSitemapParsed} />
      {sitemapPageCount !== null ? <p>Pages found in sitemap: {sitemapPageCount}</p> : <p>No sitemaps found</p>}
    </div>
  );
};
