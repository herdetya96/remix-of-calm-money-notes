import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { X } from "lucide-react";
import { addTransaction, CATEGORIES, useProfile, type TxType } from "@/lib/store";
import { CategoryIcon } from "./CategoryIcon";
import { toast } from "sonner";

export function AddTransactionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const profile = useProfile();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const available = CATEGORIES.filter((c) => c.type === type || c.type === "both");
  const valid = !!amount && Number(amount) > 0 && !!category && !!date;

  function reset() {
    setType("expense");
    setAmount("");
    setCategory("food");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    addTransaction({
      type,
      amount: Number(amount),
      category_id: category,
      description: description || undefined,
      date,
    });
    toast.success(`${type === "income" ? "Income" : "Expense"} added`);
    onOpenChange(false);
    reset();
  }

  const symbol = profile.currency === "USD" ? "$" : profile.currency === "EUR" ? "\u20ac" : profile.currency === "SGD" ? "S$" : "Rp";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(26,28,30,0.18)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 left-1/2 -translate-x-1/2 bottom-0 md:top-1/2 md:-translate-y-1/2 w-full md:max-w-md bg-paper rounded-t-2xl md:rounded-2xl shadow-[var(--shadow-md)] p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[15px] font-semibold text-ink-900 tracking-[-0.13px]">
              New transaction
            </Dialog.Title>
            <Dialog.Close className="h-7 w-7 rounded-md flex items-center justify-center text-ink-500 hover:bg-ink-40">
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="flex p-1 rounded-full bg-ink-40">
              {(["expense", "income"] as TxType[]).map((t) => {
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setCategory(t === "income" ? "salary" : "food");
                    }}
                    className={
                      "flex-1 h-8 rounded-full text-[13px] font-medium capitalize transition-colors " +
                      (active ? "bg-accent-100 text-accent" : "text-ink-400 hover:text-ink-700")
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <div>
              <div className="eyebrow mb-1.5">Amount</div>
              <div className="hairline focus-within:hairline-focus rounded-xl px-3 h-14 flex items-center bg-paper">
                <span className="doc-num text-[24px] font-bold text-ink-400 mr-1">{symbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="doc-num flex-1 bg-transparent text-[24px] font-bold text-ink-900 outline-none placeholder:text-ink-400"
                />
              </div>
            </div>

            <div>
              <div className="eyebrow mb-2">Category</div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {available.map((c) => {
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={
                        "flex flex-col items-center gap-1.5 py-2.5 rounded-[10px] transition-colors " +
                        (active
                          ? "bg-accent-100 text-accent"
                          : "bg-paper hairline text-ink-500 hover:text-ink-700")
                      }
                    >
                      <CategoryIcon name={c.icon} className="h-4 w-4" />
                      <span className={"text-[11px] leading-3 " + (active ? "text-accent font-medium" : "text-ink-400")}>
                        {c.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="eyebrow mb-1.5">Note</div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note (optional)"
                className="hairline focus-within:hairline-focus w-full rounded-xl h-10 px-3 text-[13px] text-ink-900 placeholder:text-ink-400 outline-none bg-paper"
              />
            </div>

            <div>
              <div className="eyebrow mb-1.5">Date</div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="hairline focus-within:hairline-focus w-full rounded-xl h-10 px-3 text-[13px] text-ink-900 outline-none bg-paper"
              />
            </div>

            <button
              type="submit"
              disabled={!valid}
              className="w-full h-11 rounded-[10px] bg-accent text-paper text-[14px] font-semibold shadow-[var(--shadow-xs)] hover:brightness-105 active:scale-[0.98] transition disabled:bg-ink-40 disabled:text-ink-400 disabled:shadow-none"
            >
              {type === "income" ? "Add Income" : "Add Expense"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}