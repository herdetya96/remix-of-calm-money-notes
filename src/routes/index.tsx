import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTransactions, useProfile } from "@/lib/store";
import { formatMoney, formatLongDate } from "@/lib/format";
import { Card } from "@/components/Card";
import { SectionLabel } from "@/components/SectionLabel";
import { TransactionRow } from "@/components/TransactionRow";
import { Link } from "@tanstack/react-router";
import { TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · Ledger" },
      { name: "description", content: "Your spending and income at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const txs = useTransactions();
  const profile = useProfile();

  const stats = useMemo(() => {
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { balance: income - expense, income, expense };
  }, [txs]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        income: 0,
        expense: 0,
      });
    }
    txs.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) m[t.type] += t.amount;
    });
    return months;
  }, [txs]);

  const recent = useMemo(
    () =>
      [...txs]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5),
    [txs],
  );

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-[16px] font-semibold text-ink-900 tracking-[-0.18px]">Overview</h1>
        <p className="text-[13px] text-ink-500 mt-0.5">{formatLongDate(new Date().toISOString())}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Total Balance" value={formatMoney(stats.balance, profile.currency)} trend="+12.4%" trendUp />
        <StatCard label="Income" value={formatMoney(stats.income, profile.currency)} valueClass="text-accent" trend="+8.2%" trendUp />
        <StatCard label="Expenses" value={formatMoney(stats.expense, profile.currency)} trend="-3.1%" trendUp={false} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Spending Overview</SectionLabel>
          <div className="flex gap-1">
            {["6M", "3M", "1M"].map((p, i) => (
              <button
                key={p}
                type="button"
                className={
                  "h-7 px-3 rounded-[10px] text-[13px] font-medium transition-colors " +
                  (i === 0 ? "bg-accent-100 text-accent" : "bg-ink-40 text-ink-400 hover:text-ink-700")
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2e6de9" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#2e6de9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(26,28,30,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "rgba(26,28,30,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "rgba(26,28,30,0.4)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "none",
                  borderRadius: 12,
                  boxShadow: "0 4px 9px rgba(0,0,0,.07), 0 16px 16px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.03)",
                  fontSize: 12,
                }}
                formatter={(v: number) => formatMoney(v, profile.currency)}
              />
              <Area type="monotone" dataKey="expense" stroke="#2e6de9" strokeWidth={2} fill="url(#fillAcc)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-[15px] font-semibold text-ink-700 tracking-[-0.13px]">Recent Transactions</h2>
          <Link to="/transactions" className="text-[13px] font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-ink-150">
          {recent.map((t) => (
            <TransactionRow key={t.id} tx={t} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label, value, valueClass = "text-ink-900", trend, trendUp,
}: {
  label: string; value: string; valueClass?: string; trend: string; trendUp: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{label}</SectionLabel>
        <span
          className={
            "inline-flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5 " +
            (trendUp
              ? "text-green bg-[var(--color-green-tint)]"
              : "text-red bg-[var(--color-red-tint)]")
          }
        >
          {trendUp ? <TrendingUp className="h-3 w-3" strokeWidth={2} /> : <TrendingDown className="h-3 w-3" strokeWidth={2} />}
          {trend}
        </span>
      </div>
      <div className={"doc-num text-[24px] font-bold leading-7 " + valueClass}>{value}</div>
    </Card>
  );
}
