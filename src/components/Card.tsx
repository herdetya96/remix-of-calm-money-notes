import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "bg-paper rounded-xl shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sr)] transition-shadow " +
        className
      }
    >
      {children}
    </div>
  );
}