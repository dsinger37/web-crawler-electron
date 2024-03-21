import { Input } from "./base/Input";

interface WebsiteInputProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export const WebsiteInput = ({ value, onChange, className }: WebsiteInputProps) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={className}>
      <label htmlFor="website-input" className="mb-2 block">
        Enter website URL:
      </label>
      <Input type="text" id="website-input" value={value} onChange={handleInputChange} placeholder="https://example.com" />
    </div>
  );
};
