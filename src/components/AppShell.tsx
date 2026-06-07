import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, ListOrdered, PieChart, Settings, Search, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AddTransactionModal } from "./AddTransactionModal";
import { useProfile } from "@/lib/store";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profile = useProfile();

  return (
    <div className="min-h-screen bg-canvas text-ink-900">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[280px] flex-col px-4 py-5 bg-canvas">
        <div className="px-2 mb-6 flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-ink-900 flex items-center justify-center text-paper text-[11px] font-semibold">L</div>
          <span className="text-[15px] font-semibold tracking-[-0.13px]">Ledger</span>
        </div>

        <div className="eyebrow px-2 mb-2">Views</div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-2 px-2 py-[7px] rounded-md text-[13px] leading-4 tracking-[-0.04px] transition-colors " +
                  (active
                    ? "bg-ink-60 text-ink-900 font-medium"
                    : "text-ink-700 hover:bg-ink-40")
                }
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2 pt-4">
          <div className="text-[12px] text-ink-500">Signed in as</div>
          <div className="text-[13px] font-medium text-ink-900 truncate">{profile.name}</div>
        </div>
      </aside>

      <div className="md:ml-[280px] min-h-screen flex flex-col">
        <header className="h-12 sticky top-0 z-20 bg-canvas/95 backdrop-blur flex items-center px-4 md:px-8 gap-3">
          <div className="md:hidden flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-ink-900 flex items-center justify-center text-paper text-[11px] font-semibold">L</div>
            <span className="text-[15px] font-semibold tracking-[-0.13px]">Ledger</span>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="hidden md:flex items-center gap-2 w-full max-w-[440px] h-9 px-3 rounded-xl hairline bg-paper">
              <Search className="h-4 w-4 text-ink-500" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search transactions..."
                className="flex-1 bg-transparent text-[13px] text-ink-900 placeholder:text-ink-400 outline-none"
              />
            </div>
          </div>
          <button
            type="button"
            aria-label="Search"
            className="md:hidden h-9 w-9 rounded-md hairline flex items-center justify-center text-ink-700"
          >
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>

        <main className="flex-1 px-4 md:px-8 pb-28 md:pb-12 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label="Add transaction"
        className="fixed bottom-20 md:bottom-6 right-6 h-12 w-12 rounded-full bg-accent text-paper flex items-center justify-center shadow-[var(--shadow-sr)] hover:scale-[1.04] active:scale-95 transition-transform z-30"
      >
        <Plus className="h-5 w-5" strokeWidth={2} />
      </button>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-paper shadow-[var(--shadow-sr)] flex items-center justify-around h-16 px-2">
        {NAV.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-md " +
                (active ? "text-accent" : "text-ink-400")
              }
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[11px] leading-3 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <AddTransactionModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}