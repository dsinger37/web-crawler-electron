interface WebsiteInputProps {
  value: string;
  onChange: (url: string) => void;
}

export const WebsiteInput = ({ value, onChange }: WebsiteInputProps) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <label htmlFor="website-input">Enter website URL:</label>
      <input type="text" id="website-input" value={value} onChange={handleInputChange} placeholder="https://example.com" />
    </div>
  );
};
