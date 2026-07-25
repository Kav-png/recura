export type CountryCode = "US" | "GB" | "CA" | "AU" | "IE";

export const COUNTRIES: Record<CountryCode, { name: string; flag: string; emergencyNumber: string }> = {
  US: { name: "United States", flag: "🇺🇸", emergencyNumber: "911" },
  GB: { name: "United Kingdom", flag: "🇬🇧", emergencyNumber: "999" },
  CA: { name: "Canada", flag: "🇨🇦", emergencyNumber: "911" },
  AU: { name: "Australia", flag: "🇦🇺", emergencyNumber: "000" },
  IE: { name: "Ireland", flag: "🇮🇪", emergencyNumber: "112" },
};

export const DEFAULT_COUNTRY: CountryCode = "US";

export function isCountryCode(value: string): value is CountryCode {
  return value in COUNTRIES;
}

export function emergencyNumberFor(country: string | null | undefined): string {
  return COUNTRIES[(country as CountryCode) ?? DEFAULT_COUNTRY]?.emergencyNumber ?? COUNTRIES[DEFAULT_COUNTRY].emergencyNumber;
}
