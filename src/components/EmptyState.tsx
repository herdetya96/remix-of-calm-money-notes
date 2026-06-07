import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <Icon className="h-10 w-10 text-ink-400 mb-4" strokeWidth={1.5} />
      <h3 className="doc-num text-[20px] font-bold text-ink-900 mb-1">{title}</h3>
      <p className="text-[13px] text-ink-500 max-w-xs">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 h-9 px-4 rounded-[10px] bg-accent text-paper text-[13px] font-medium shadow-[var(--shadow-xs)] hover:brightness-105 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}