export const COUNTRY_CODES = [
  { code: "+91", iso: "IN", name: "India", digits: 10 },
  { code: "+1", iso: "US", name: "United States", digits: 10 },
  { code: "+44", iso: "GB", name: "United Kingdom", digits: 10 },
  { code: "+61", iso: "AU", name: "Australia", digits: 9 },
  { code: "+971", iso: "AE", name: "UAE", digits: 9 },
  { code: "+65", iso: "SG", name: "Singapore", digits: 8 },
  { code: "+49", iso: "DE", name: "Germany", digits: 11 },
  { code: "+33", iso: "FR", name: "France", digits: 9 },
  { code: "+81", iso: "JP", name: "Japan", digits: 10 },
  { code: "+86", iso: "CN", name: "China", digits: 11 },
];

export const isName = (v: string) => /^[A-Za-z][A-Za-z\s.'-]{1,60}$/.test(v.trim());
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isUrl = (v: string) => { try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } };
export const isLinkedIn = (v: string) => isUrl(v) && /linkedin\.com\//i.test(v);
export const isGitHub = (v: string) => isUrl(v) && /github\.com\//i.test(v);
export const isCgpa = (v: number) => Number.isFinite(v) && v >= 0 && v <= 10;
export const isGradYear = (v: number) => {
  const y = new Date().getFullYear();
  return Number.isInteger(v) && v >= y - 10 && v <= y + 8;
};
export const isPhoneForCountry = (digits: string, code: string) => {
  const c = COUNTRY_CODES.find((x) => x.code === code);
  if (!c) return /^\d{6,15}$/.test(digits);
  return new RegExp(`^\\d{${c.digits}}$`).test(digits);
};
