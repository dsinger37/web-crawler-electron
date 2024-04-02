import { Button } from "./base/Button";
import { Description, Field, Label } from "./base/Fieldset";
import { Input } from "./base/Input";

interface CrawlSettingsProps {
  setShowCrawlSettings: (showCrawlSettings: boolean) => void;
  setMaxRequests: React.Dispatch<React.SetStateAction<number>>;
  maxRequests: number;
  setMaxConcurrency: React.Dispatch<React.SetStateAction<number>>;
  maxConcurrency: number;
  setUrlsToExclude: React.Dispatch<React.SetStateAction<string[]>>;
  urlsToExclude: string[];
}
export const CrawlSettings = ({
  setShowCrawlSettings,
  setMaxRequests,
  maxRequests,
  setMaxConcurrency,
  maxConcurrency,
  setUrlsToExclude,
  urlsToExclude,
}: CrawlSettingsProps) => {
  const handleUrlsToExclude = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlsToExclude(e.target.value.split(","));
  };

  return (
    <div className="mb-6">
      <h1 className="text-4xl text-center mb-6">Crawl Settings</h1>
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <label>
            Max Requests:
            <Input type="number" value={maxRequests} onChange={(e) => setMaxRequests(Number(e.target.value))} className="mb-6 mt-2" />
          </label>
          <label>
            Max Concurrency:
            <Input type="number" value={maxConcurrency} onChange={(e) => setMaxConcurrency(Number(e.target.value))} className="mb-6 mt-2" />
          </label>
          <Field>
            <Label>URLs To Exclude:</Label>
            <Description>Separate URLs with a comma</Description>
            <Input type="text" value={urlsToExclude} onChange={handleUrlsToExclude} className="mb-6 mt-2" />
          </Field>
          <Button onClick={() => setShowCrawlSettings(false)}>Close Settings</Button>
        </div>
      </div>
    </div>
  );
};
