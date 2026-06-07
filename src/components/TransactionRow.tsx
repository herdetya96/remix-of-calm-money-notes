import { useProfile, deleteTransaction, categoryById, type Transaction } from "@/lib/store";
import { formatMoney, formatDate } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import { Trash2 } from "lucide-react";

export function TransactionRow({ tx, withDescription = false, deletable = false }: {
  tx: Transaction;
  withDescription?: boolean;
  deletable?: boolean;
}) {
  const profile = useProfile();
  const cat = categoryById(tx.category_id);
  const isIncome = tx.type === "income";
  return (
    <div className="group flex items-center gap-3 px-4 py-[13px] hover:bg-ink-40 transition-colors">
      <div className="h-9 w-9 rounded-[10px] bg-ink-40 flex items-center justify-center text-ink-900 shrink-0">
        <CategoryIcon name={cat.icon} className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-ink-700 truncate tracking-[-0.09px]">
          {tx.description || cat.name}
        </div>
        <div className="text-[12px] text-ink-500 truncate">
          {withDescription ? `${cat.name} · ${formatDate(tx.date)}` : formatDate(tx.date)}
        </div>
      </div>
      <div className={"doc-num text-[14px] tabular-nums " + (isIncome ? "text-accent font-medium" : "text-ink-900 font-semibold")}>
        {isIncome ? "+" : "−"}{formatMoney(tx.amount, profile.currency).replace(/^[-]/, "")}
      </div>
      {deletable && (
        <button
          type="button"
          onClick={() => deleteTransaction(tx.id)}
          aria-label="Delete"
          className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-md flex items-center justify-center text-ink-400 hover:text-red hover:bg-ink-40 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}