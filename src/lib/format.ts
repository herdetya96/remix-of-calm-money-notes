import type { Profile } from "./store";

const SYMBOLS: Record<Profile["currency"], string> = {
  USD: "$",
  EUR: "€",
  SGD: "S$",
  IDR: "Rp",
};

export function formatMoney(amount: number, currency: Profile["currency"] = "USD") {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = currency === "IDR"
    ? abs.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${SYMBOLS[currency]}${formatted}`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}