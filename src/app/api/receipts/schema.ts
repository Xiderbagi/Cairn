import { z } from "zod";
import { T2125_EXPENSE_LINES, type ExpenseLine } from "@/lib/tax";

const lines = Object.keys(T2125_EXPENSE_LINES) as [ExpenseLine, ...ExpenseLine[]];

// Shape Claude must return. Kept free of numeric bounds so it maps cleanly to a structured-output
// JSON schema; ranges are enforced in clampDraft after parsing.
export const ReceiptDraftSchema = z.object({
  type: z.enum(["income", "expense"]),
  date: z.string().describe("YYYY-MM-DD"),
  description: z.string().describe("Short vendor or client plus what it was for, at most 60 characters"),
  amount: z.number().describe("Amount before GST/HST"),
  salesTax: z.number().describe("GST/HST portion only; 0 if none. Exclude PST, QST and RST."),
  category: z.enum(lines).nullable().describe("T2125 expense line code; null for income"),
  businessUsePct: z.number().describe("0-100; 100 unless the purchase is clearly partly personal"),
  note: z.string().describe("One plain sentence explaining the category choice"),
});

export type ReceiptDraft = z.infer<typeof ReceiptDraftSchema>;

export function clampDraft(d: ReceiptDraft, today: string): ReceiptDraft {
  const round = (n: number) => Math.round(Math.max(0, n || 0) * 100) / 100;
  return {
    ...d,
    date: /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : today,
    description: d.description.trim().slice(0, 200) || "Receipt",
    amount: round(d.amount),
    salesTax: round(d.salesTax),
    category: d.type === "income" ? null : d.category ?? "9270",
    businessUsePct: Math.min(100, Math.max(0, Math.round(d.businessUsePct ?? 100))),
  };
}
