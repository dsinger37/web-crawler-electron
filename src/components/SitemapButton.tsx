import { Button } from "./base/Button";

interface SitemapButtonProps {
  websiteUrl: string;
  onSitemapParsed: (pageCount: number) => void;
  setSitemapChecked: React.Dispatch<React.SetStateAction<boolean>>;
  setParsingSitemap: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

export const SitemapButton = ({ websiteUrl, onSitemapParsed, setSitemapChecked, setParsingSitemap, className }: SitemapButtonProps) => {
  const handleClick = async () => {
    setSitemapChecked(false);
    setParsingSitemap(true);
    const pageCount = await window.electronApi.invoke("check-sitemap", websiteUrl);
    setParsingSitemap(false);
    setSitemapChecked(true);
    onSitemapParsed(pageCount);
  };

  return (
    <Button onClick={handleClick} className={className}>
      Check Sitemap
    </Button>
  );
};
