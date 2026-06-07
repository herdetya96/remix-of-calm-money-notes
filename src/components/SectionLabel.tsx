import type { ReactNode } from "react";

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={"eyebrow " + className}>{children}</div>;
}