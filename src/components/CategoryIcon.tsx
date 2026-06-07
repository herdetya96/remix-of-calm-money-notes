import {
  Utensils, Car, ShoppingBag, Receipt, Gamepad2, HeartPulse, BookOpen,
  Briefcase, Laptop, TrendingUp, CircleDot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Utensils, Car, ShoppingBag, Receipt, Gamepad2, HeartPulse, BookOpen,
  Briefcase, Laptop, TrendingUp, CircleDot,
};

export function CategoryIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? CircleDot;
  return <Icon className={className} strokeWidth={1.5} />;
}