"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTransaction, type ActionState } from "../../actions";
import { T2125_EXPENSE_LINES, type ExpenseLine } from "@/lib/tax";
import type { ReceiptDraft } from "@/app/api/receipts/schema";

interface Draft {
  type: "income" | "expense";
  date: string;
  description: string;
  amount: string;
  salesTax: string;
  category: ExpenseLine;
  businessUsePct: string;
}

const today = () => new Date().toLocaleDateString("en-CA");
const blank = (type: Draft["type"] = "expense", category: ExpenseLine = "8810"): Draft => ({
  type, date: today(), description: "", amount: "", salesTax: "", category, businessUsePct: "100",
});

export function EntryForm(props: { salesTaxName: string; salesTaxRate: number; gstRegistered: boolean; receiptsEnabled: boolean }) {
  const [draft, setDraft] = useState<Draft>(blank());
  const [formKey, setFormKey] = useState(0); // remount inputs when a draft is loaded or saved
  const [state, action, pending] = useActionState<ActionState, FormData>(addTransaction, null);
  const lastState = useRef(state);

  useEffect(() => {
    if (state !== lastState.current && state?.ok) {
      setDraft((d) => blank(d.type, d.category));
      setFormKey((k) => k + 1);
    }
    lastState.current = state;
  }, [state]);

  const load = (d: Partial<Draft>) => { setDraft((cur) => ({ ...cur, ...d })); setFormKey((k) => k + 1); };
  const isExpense = draft.type === "expense";

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      <section className="panel">
        <h3 className="mb-3 font-medium">New entry</h3>
        <form key={formKey} action={action} className="flex flex-col gap-3">
          <div className="inline-flex self-start overflow-hidden rounded-lg border border-line" role="group" aria-label="Entry type">
            {(["income", "expense"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={draft.type === t} onClick={() => load({ type: t })}
                className={`cursor-pointer px-3.5 py-1.5 text-[0.88rem] font-medium ${draft.type === t ? "bg-accent text-surface" : "bg-surface text-muted"}`}>
                {t === "income" ? "Money in" : "Money out"}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={draft.type} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <label className="field col-span-full" htmlFor="description">Description
              <input id="description" name="description" required maxLength={200} defaultValue={draft.description}
                placeholder={isExpense ? "Vendor and what you bought" : "Client or invoice number"} />
            </label>
            <label className="field" htmlFor="date">Date<input id="date" name="date" type="date" required defaultValue={draft.date} /></label>
            <label className="field" htmlFor="amount">Amount before tax
              <input id="amount" name="amount" type="number" step="0.01" min="0" required inputMode="decimal" defaultValue={draft.amount} />
            </label>
            <label className="field" htmlFor="salesTax">{props.salesTaxName} {isExpense ? "paid" : "charged"}
              <input id="salesTax" name="salesTax" type="number" step="0.01" min="0" inputMode="decimal" defaultValue={draft.salesTax || "0"} />
            </label>
            {isExpense && (
              <>
                <label className="field col-span-full" htmlFor="category">T2125 category
                  <select id="category" name="category" defaultValue={draft.category}>
                    {Object.entries(T2125_EXPENSE_LINES).map(([code, label]) => <option key={code} value={code}>{code} · {label}</option>)}
                  </select>
                </label>
                <label className="field" htmlFor="businessUsePct">Business use %
                  <input id="businessUsePct" name="businessUsePct" type="number" min="0" max="100" defaultValue={draft.businessUsePct} />
                </label>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save entry"}</button>
            <button type="button" className="btn btn-ghost" onClick={(e) => {
              const form = e.currentTarget.form!;
              const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value) || 0;
              (form.elements.namedItem("salesTax") as HTMLInputElement).value = (amount * props.salesTaxRate / 100).toFixed(2);
            }}>Add {props.salesTaxRate}% {props.salesTaxName}</button>
          </div>
          {state && <p className={`text-[0.88rem] ${state.ok ? "text-good" : "text-bad"}`}>{state.message}</p>}
          <p className="note">
            {isExpense ? "Use business-use % for things you also use personally, like a phone or car."
              : props.gstRegistered ? `Record the ${props.salesTaxName} you charged separately from your fee.` : `You're not registered, so leave ${props.salesTaxName} at 0.`}
          </p>
        </form>
      </section>
      {props.receiptsEnabled && <ReceiptReader onDraft={(d) => load({
        type: d.type, date: d.date, description: d.description, amount: d.amount.toFixed(2), salesTax: d.salesTax.toFixed(2),
        category: d.category ?? "9270", businessUsePct: String(d.businessUsePct),
      })} />}
    </div>
  );
}

function ReceiptReader({ onDraft }: { onDraft: (d: ReceiptDraft) => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function read(form: HTMLFormElement) {
    const data = new FormData(form);
    const file = data.get("receipt");
    if (!String(data.get("text") ?? "").trim() && !(file instanceof File && file.size)) {
      setNote({ ok: false, text: "Type a description or attach a receipt first." });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/receipts", { method: "POST", body: data });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't read that receipt.");
      onDraft(body.draft as ReceiptDraft);
      setNote({ ok: true, text: body.draft.note || "Form filled. Check it, then save." });
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Couldn't read that receipt." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h3 className="mb-3 font-medium">Let Claude read it</h3>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); read(e.currentTarget); }}>
        <label className="field" htmlFor="text">Describe the transaction, or paste an invoice or emailed receipt
          <textarea id="text" name="text" rows={4} placeholder="e.g. Staples, Oct 3, printer ink and paper $86.40 + HST" />
        </label>
        <label className="field" htmlFor="receipt">Or attach a photo of the receipt
          <input id="receipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          <button className="btn" disabled={busy}>{busy ? "Reading…" : "Fill in the form"}</button>
          <span className="note">Check the result before you save.</span>
        </div>
        {note && <p className={`rounded-lg px-3 py-2 text-[0.88rem] ${note.ok ? "bg-accent-soft" : "text-bad"}`}>{note.text}</p>}
      </form>
    </section>
  );
}
