import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useProfile, setProfile, CATEGORIES, useTransactions, exportCsv, clearAllTransactions, type Profile } from "@/lib/store";
import { Card } from "@/components/Card";
import { SectionLabel } from "@/components/SectionLabel";
import { CategoryIcon } from "@/components/CategoryIcon";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Ledger" },
      { name: "description", content: "Profile, categories, and data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useProfile();
  const txs = useTransactions();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function update<K extends keyof Profile>(k: K, v: Profile[K]) {
    setProfile({ ...profile, [k]: v });
  }

  return (
    <div className="py-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[16px] font-semibold text-ink-900 tracking-[-0.18px]">Settings</h1>
        <p className="text-[13px] text-ink-500 mt-0.5">Personalize your ledger</p>
      </div>

      <section className="space-y-3">
        <SectionLabel>Profile</SectionLabel>
        <Card className="p-5 space-y-4">
          <Field label="Name">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => update("name", e.target.value)}
              className="hairline focus-within:hairline-focus w-full rounded-xl h-10 px-3 text-[13px] text-ink-900 outline-none bg-paper"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={profile.email}
              onChange={(e) => update("email", e.target.value)}
              className="hairline focus-within:hairline-focus w-full rounded-xl h-10 px-3 text-[13px] text-ink-900 outline-none bg-paper"
            />
          </Field>
          <Field label="Currency">
            <select
              value={profile.currency}
              onChange={(e) => update("currency", e.target.value as Profile["currency"])}
              className="hairline focus-within:hairline-focus w-full rounded-xl h-10 px-3 text-[13px] text-ink-900 outline-none bg-paper"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="SGD">SGD — Singapore Dollar</option>
              <option value="IDR">IDR — Indonesian Rupiah</option>
            </select>
          </Field>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionLabel>Categories</SectionLabel>
        <Card>
          <div className="divide-y divide-ink-150">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-40 transition-colors">
                <div className="h-8 w-8 rounded-[10px] bg-ink-40 flex items-center justify-center text-ink-900">
                  <CategoryIcon name={c.icon} />
                </div>
                <span className="text-[14px] text-ink-700 flex-1">{c.name}</span>
                <span className="text-[11px] text-ink-500 uppercase tracking-wider font-medium">{c.type}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionLabel>Data</SectionLabel>
        <Card className="p-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportCsv(txs)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-[10px] hairline text-[13px] font-medium text-ink-900 hover:bg-ink-40 transition-colors"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-[10px] hairline text-[13px] font-medium text-red hover:bg-ink-40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Clear all data
          </button>
        </Card>
      </section>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(26,28,30,0.18)]" />
          <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-paper rounded-2xl shadow-[var(--shadow-md)] p-6">
            <Dialog.Title className="text-[15px] font-semibold text-ink-900 mb-2">Clear all transactions?</Dialog.Title>
            <Dialog.Description className="text-[13px] text-ink-500 mb-5">
              This permanently removes every transaction from this device. This cannot be undone.
            </Dialog.Description>
            <div className="flex gap-2 justify-end">
              <Dialog.Close className="h-9 px-3 rounded-[10px] hairline text-[13px] font-medium text-ink-900 hover:bg-ink-40">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  clearAllTransactions();
                  setConfirmOpen(false);
                  toast.success("All transactions cleared");
                }}
                className="h-9 px-3 rounded-[10px] bg-red text-paper text-[13px] font-medium shadow-[var(--shadow-xs)]"
              >
                Clear data
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      {children}
    </div>
  );
}