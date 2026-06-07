import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { useTransactions, CATEGORIES, categoryById } from "@/lib/store";
import { Card } from "@/components/Card";
import { TransactionRow } from "@/components/TransactionRow";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions · Ledger" },
      { name: "description", content: "Browse and search every transaction." },
    ],
  }),
  component: TransactionsPage,
});

type Filter = "all" | "income" | "expense" | string;

function TransactionsPage() {
  const txs = useTransactions();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return txs
      .filter((t) => {
        if (filter === "all") return true;
        if (filter === "income" || filter === "expense") return t.type === filter;
        return t.category_id === filter;
      })
      .filter((t) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          (t.description ?? "").toLowerCase().includes(q) ||
          categoryById(t.category_id).name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [txs, query, filter]);

  const pills: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "income", label: "Income" },
    { id: "expense", label: "Expense" },
    ...CATEGORIES.filter((c) => c.type !== "income").slice(0, 6).map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <div className="py-6 space-y-5">
      <div>
        <h1 className="text-[16px] font-semibold text-ink-900 tracking-[-0.18px]">Transactions</h1>
        <p className="text-[13px] text-ink-500 mt-0.5">{txs.length} entries total</p>
      </div>

      <div className="flex items-center gap-2 h-10 px-3 rounded-xl hairline focus-within:hairline-focus bg-paper">
        <Search className="h-4 w-4 text-ink-500" strokeWidth={1.5} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions..."
          className="flex-1 bg-transparent text-[13px] text-ink-900 placeholder:text-ink-400 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pills.map((p) => {
          const active = filter === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilter(p.id)}
              className={
                "h-7 pl-2 pr-3 rounded-[10px] text-[13px] font-medium transition-colors " +
                (active ? "bg-accent-100 text-accent" : "bg-ink-40 text-ink-400 hover:text-ink-700")
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No transactions found"
            body="Try a different search or filter, or add your first one."
          />
        ) : (
          <div className="divide-y divide-ink-150">
            {filtered.map((t) => (
              <TransactionRow key={t.id} tx={t} withDescription deletable />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}