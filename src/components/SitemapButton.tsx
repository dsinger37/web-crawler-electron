import { Button } from "./base/Button";

interface SitemapButtonProps {
  websiteUrl: string;
  onSitemapParsed: (pageCount: number) => void;
  setSitemapChecked: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

export const SitemapButton = ({ websiteUrl, onSitemapParsed, setSitemapChecked, className }: SitemapButtonProps) => {
  const handleClick = async () => {
    setSitemapChecked(false);
    const pageCount = await window.electronApi.invoke("check-sitemap", websiteUrl);

    setSitemapChecked(true);
    onSitemapParsed(pageCount);
  };

  return (
    <Button onClick={handleClick} className={className}>
      Check Sitemap
    </Button>
  );
};
