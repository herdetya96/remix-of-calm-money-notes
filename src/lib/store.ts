import { useEffect, useState } from "react";

export type TxType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense" | "both";
};

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  category_id: string;
  description?: string;
  date: string; // ISO yyyy-mm-dd
};

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food & Drinks", icon: "Utensils", type: "expense" },
  { id: "transport", name: "Transport", icon: "Car", type: "expense" },
  { id: "shopping", name: "Shopping", icon: "ShoppingBag", type: "expense" },
  { id: "bills", name: "Bills & Utilities", icon: "Receipt", type: "expense" },
  { id: "entertainment", name: "Entertainment", icon: "Gamepad2", type: "expense" },
  { id: "health", name: "Health", icon: "HeartPulse", type: "expense" },
  { id: "education", name: "Education", icon: "BookOpen", type: "expense" },
  { id: "salary", name: "Salary", icon: "Briefcase", type: "income" },
  { id: "freelance", name: "Freelance", icon: "Laptop", type: "income" },
  { id: "investment", name: "Investment", icon: "TrendingUp", type: "income" },
  { id: "other", name: "Other", icon: "CircleDot", type: "both" },
];

export const categoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

const STORAGE_KEY = "ledger.transactions.v1";
const CURRENCY_KEY = "ledger.currency.v1";
const PROFILE_KEY = "ledger.profile.v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function seed(): Transaction[] {
  const e = (n: number, amount: number, category_id: string, description: string): Transaction => ({
    id: uid(),
    type: "expense",
    amount,
    category_id,
    description,
    date: daysAgo(n),
  });
  const i = (n: number, amount: number, category_id: string, description: string): Transaction => ({
    id: uid(),
    type: "income",
    amount,
    category_id,
    description,
    date: daysAgo(n),
  });
  return [
    i(1, 4200, "salary", "Monthly salary"),
    e(1, 24.5, "food", "Lunch with team"),
    e(2, 68, "transport", "Uber rides"),
    e(3, 120, "shopping", "New sneakers"),
    e(4, 14, "food", "Coffee + bagel"),
    e(5, 220, "bills", "Internet & utilities"),
    e(6, 38, "entertainment", "Netflix + Spotify"),
    i(8, 950, "freelance", "Design contract"),
    e(9, 45, "food", "Groceries"),
    e(11, 18, "transport", "Metro card"),
    e(14, 95, "health", "Pharmacy"),
    e(17, 60, "food", "Dinner out"),
    e(20, 180, "shopping", "Books & misc"),
    e(22, 32, "entertainment", "Concert ticket"),
    e(25, 75, "food", "Weekend groceries"),
    i(28, 320, "investment", "Dividends"),
    e(32, 210, "bills", "Phone bill"),
    e(38, 88, "food", "Restaurant"),
    e(45, 150, "shopping", "Winter jacket"),
    e(60, 240, "transport", "Flight to visit family"),
  ];
}

export type Profile = {
  name: string;
  email: string;
  currency: "USD" | "EUR" | "SGD" | "IDR";
};

const DEFAULT_PROFILE: Profile = { name: "Alex Carter", email: "alex@ledger.app", currency: "USD" };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("ledger:change"));
}

function loadTransactions(): Transaction[] {
  const existing = read<Transaction[] | null>(STORAGE_KEY, null);
  if (existing && existing.length) return existing;
  const seeded = seed();
  write(STORAGE_KEY, seeded);
  return seeded;
}

export function useTransactions() {
  const [items, setItems] = useState<Transaction[]>([]);
  useEffect(() => {
    setItems(loadTransactions());
    const onChange = () => setItems(read<Transaction[]>(STORAGE_KEY, []));
    window.addEventListener("ledger:change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("ledger:change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return items;
}

export function addTransaction(tx: Omit<Transaction, "id">) {
  const current = read<Transaction[]>(STORAGE_KEY, []);
  write(STORAGE_KEY, [{ ...tx, id: uid() }, ...current]);
}

export function deleteTransaction(id: string) {
  const current = read<Transaction[]>(STORAGE_KEY, []);
  write(STORAGE_KEY, current.filter((t) => t.id !== id));
}

export function clearAllTransactions() {
  write(STORAGE_KEY, []);
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  useEffect(() => {
    setProfileState(read<Profile>(PROFILE_KEY, DEFAULT_PROFILE));
    const onChange = () => setProfileState(read<Profile>(PROFILE_KEY, DEFAULT_PROFILE));
    window.addEventListener("ledger:change", onChange);
    return () => window.removeEventListener("ledger:change", onChange);
  }, []);
  return profile;
}

export function setProfile(p: Profile) {
  write(PROFILE_KEY, p);
  write(CURRENCY_KEY, p.currency);
}

export function exportCsv(items: Transaction[]) {
  const header = "date,type,category,amount,description\n";
  const rows = items
    .map((t) =>
      [
        t.date,
        t.type,
        categoryById(t.category_id).name,
        t.amount.toFixed(2),
        (t.description ?? "").replace(/"/g, '""'),
      ]
        .map((v) => `"${v}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}