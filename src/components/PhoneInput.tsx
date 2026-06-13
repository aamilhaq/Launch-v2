import { COUNTRY_CODES } from "@/lib/validators";
import { Input } from "@/components/ui/input";

interface Props {
  code: string;
  digits: string;
  onChange: (code: string, digits: string) => void;
  error?: string;
  id?: string;
}

export const PhoneInput = ({ code, digits, onChange, error, id }: Props) => {
  const c = COUNTRY_CODES.find((x) => x.code === code) ?? COUNTRY_CODES[0];
  return (
    <div>
      <div className="flex gap-2 mt-1.5">
        <select
          value={code}
          onChange={(e) => onChange(e.target.value, digits)}
          className="h-10 rounded-md border border-input bg-background px-2 text-sm shrink-0"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.iso} value={c.code}>{c.iso} {c.code}</option>
          ))}
        </select>
        <Input
          id={id}
          inputMode="numeric"
          placeholder={"0".repeat(c.digits)}
          value={digits}
          maxLength={c.digits}
          onChange={(e) => onChange(code, e.target.value.replace(/\D/g, "").slice(0, c.digits))}
          aria-invalid={!!error}
        />
      </div>
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : <p className="text-xs text-muted-foreground mt-1">{c.digits} digits</p>}
    </div>
  );
};
