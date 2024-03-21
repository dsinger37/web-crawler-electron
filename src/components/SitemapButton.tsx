interface SitemapButtonProps {
  websiteUrl: string;
  onSitemapParsed: (pageCount: number) => void;
}

export const SitemapButton = ({ websiteUrl, onSitemapParsed }: SitemapButtonProps) => {
  const handleClick = async () => {
    const pageCount = await window.electronApi.invoke("check-sitemap", websiteUrl);

    onSitemapParsed(pageCount);
  };

  return <button onClick={handleClick}>Check Sitemap</button>;
};
