import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useTransactions, useProfile, categoryById } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { Card } from "@/components/Card";
import { SectionLabel } from "@/components/SectionLabel";
import { CategoryIcon } from "@/components/CategoryIcon";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Ledger" },
      { name: "description", content: "Visualize where your money goes." },
    ],
  }),
  component: AnalyticsPage,
});

type Period = "month" | "last" | "3m" | "year";
const PERIODS: { id: Period; label: string }[] = [
  { id: "month", label: "This Month" },
  { id: "last", label: "Last Month" },
  { id: "3m", label: "3 Months" },
  { id: "year", label: "This Year" },
];

const PIE_COLORS = ["#2e6de9", "rgba(26,28,30,0.85)", "rgba(26,28,30,0.55)", "rgba(26,28,30,0.40)", "rgba(26,28,30,0.18)"];

function inRange(date: string, period: Period) {
  const d = new Date(date);
  const now = new Date();
  if (period === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (period === "last") {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === last.getFullYear() && d.getMonth() === last.getMonth();
  }
  if (period === "3m") {
    const cut = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return d >= cut;
  }
  return d.getFullYear() === now.getFullYear();
}

function AnalyticsPage() {
  const txs = useTransactions();
  const profile = useProfile();
  const [period, setPeriod] = useState<Period>("3m");

  const scoped = useMemo(() => txs.filter((t) => inRange(t.date, period)), [txs, period]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    scoped.filter((t) => t.type === "expense").forEach((t) => {
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
    });
    const arr = [...map.entries()]
      .map(([id, value]) => ({ id, name: categoryById(id).name, value, icon: categoryById(id).icon }))
      .sort((a, b) => b.value - a.value);
    const total = arr.reduce((s, x) => s + x.value, 0) || 1;
    return arr.map((x) => ({ ...x, pct: (x.value / total) * 100 }));
  }, [scoped]);

  const incomeVsExpense = useMemo(() => {
    const now = new Date();
    const months: { label: string; income: number; expense: number; key: string }[] = [];
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
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m[t.type] += t.amount;
    });
    return months;
  }, [txs]);

  const top5 = byCategory.slice(0, 5);
  const maxTop = top5[0]?.value || 1;

  const insight = top5[0]
    ? `Your biggest category this period is ${top5[0].name} at ${top5[0].pct.toFixed(0)}% of spending.`
    : "Add transactions to see insights about your spending.";

  return (
    <div className="py-6 space-y-5">
      <div>
        <h1 className="text-[16px] font-semibold text-ink-900 tracking-[-0.18px]">Analytics</h1>
        <p className="text-[13px] text-ink-500 mt-0.5">Patterns in your spending</p>
      </div>

      <div className="inline-flex p-1 rounded-full bg-ink-40">
        {PERIODS.map((p) => {
          const active = period === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={
                "h-7 px-3 rounded-full text-[13px] font-medium transition-colors " +
                (active ? "bg-accent-100 text-accent" : "text-ink-400 hover:text-ink-700")
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionLabel className="mb-4">By Category</SectionLabel>
          {byCategory.length === 0 ? (
            <div className="text-[13px] text-ink-500 py-12 text-center">No spending in this period.</div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory.slice(0, 5)} dataKey="value" innerRadius={50} outerRadius={80} strokeWidth={0}>
                      {byCategory.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatMoney(v, profile.currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {byCategory.slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 text-[13px]">
                    <span className="h-2 w-2 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-ink-700 flex-1">{c.name}</span>
                    <span className="doc-num font-semibold text-ink-900">{formatMoney(c.value, profile.currency)}</span>
                    <span className="text-[12px] text-ink-500 w-10 text-right">{c.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <SectionLabel className="mb-4">Income vs Expenses</SectionLabel>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpense} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(26,28,30,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "rgba(26,28,30,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "rgba(26,28,30,0.4)" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: number) => formatMoney(v, profile.currency)} />
                <Bar dataKey="income" fill="#2e6de9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="rgba(82,92,102,0.28)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionLabel className="mb-4">Top Categories</SectionLabel>
        <div className="space-y-3">
          {top5.map((c) => (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-[10px] bg-ink-40 flex items-center justify-center text-ink-900">
                  <CategoryIcon name={c.icon} />
                </div>
                <span className="text-[14px] text-ink-700 flex-1">{c.name}</span>
                <span className="doc-num text-[14px] font-semibold text-ink-900">{formatMoney(c.value, profile.currency)}</span>
              </div>
              <div className="h-1 rounded-full bg-ink-40 overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${(c.value / maxTop) * 100}%` }} />
              </div>
            </div>
          ))}
          {top5.length === 0 && <div className="text-[13px] text-ink-500 py-6 text-center">No data yet.</div>}
        </div>
      </Card>

      <div className="bg-paper rounded-xl shadow-[var(--shadow-xs)] p-5 border-l-[3px] border-accent">
        <div className="text-[15px] text-ink-700 leading-6">{insight}</div>
      </div>
    </div>
  );
}