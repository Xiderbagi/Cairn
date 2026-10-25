"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, getSettings, settingsToRow } from "@/lib/data";
import { CCA_CLASSES, HOME_COST_FIELDS, PROVINCE_CODES, T2125_EXPENSE_LINES, type ExpenseLine } from "@/lib/tax";

export type ActionState = { ok: boolean; message: string } | null;

const money = z.coerce.number().min(0).max(99_999_999).transform((n) => Math.round(n * 100) / 100);
const pct = z.coerce.number().min(0).max(100);
const expenseLines = Object.keys(T2125_EXPENSE_LINES) as [ExpenseLine, ...ExpenseLine[]];

function fail(error: unknown): ActionState {
  if (error instanceof z.ZodError) return { ok: false, message: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  return { ok: false, message: error instanceof Error ? error.message : "Something went wrong. Try again." };
}

function refresh() {
  for (const p of ["/dashboard", "/entries", "/home-equipment", "/taxes", "/settings"]) revalidatePath(p);
}

const TransactionInput = z.discriminatedUnion("type", [
  z.object({ type: z.literal("income"), date: z.iso.date(), description: z.string().trim().min(1).max(200), amount: money, salesTax: money }),
  z.object({
    type: z.literal("expense"), date: z.iso.date(), description: z.string().trim().min(1).max(200), amount: money, salesTax: money,
    category: z.enum(expenseLines), businessUsePct: pct,
  }),
]);

export async function addTransaction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const input = TransactionInput.parse(Object.fromEntries(form));
    const { supabase } = await requireUser();
    const { error } = await supabase.from("transactions").insert({
      type: input.type,
      date: input.date,
      description: input.description,
      amount: input.amount,
      sales_tax: input.salesTax,
      category: input.type === "expense" ? input.category : null,
      business_use_pct: input.type === "expense" ? input.businessUsePct : 100,
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: "Entry saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTransaction(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
  refresh();
}

const AssetInput = z.object({
  description: z.string().trim().min(1).max(200),
  ccaClass: z.enum(Object.keys(CCA_CLASSES) as [keyof typeof CCA_CLASSES, ...(keyof typeof CCA_CLASSES)[]]),
  cost: money,
  yearAcquired: z.coerce.number().int().min(1990).max(2035),
  businessUsePct: pct,
});

export async function addAsset(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const input = AssetInput.parse(Object.fromEntries(form));
    const { supabase } = await requireUser();
    const { error } = await supabase.from("assets").insert({
      description: input.description,
      cca_class: input.ccaClass,
      cost: input.cost,
      year_acquired: input.yearAcquired,
      business_use_pct: input.businessUsePct,
    });
    if (error) throw error;
    refresh();
    return { ok: true, message: "Item added." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAsset(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase } = await requireUser();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw error;
  refresh();
}

const SettingsInput = z.object({
  name: z.string().trim().max(120),
  province: z.enum(PROVINCE_CODES as [string, ...string[]]),
  taxYear: z.coerce.number().int().min(2020).max(2035),
  gstRegistered: z.enum(["yes", "no"]).transform((v) => v === "yes"),
  gstMethod: z.enum(["regular", "quick"]),
  supplyType: z.enum(["services", "goods"]),
  taxMode: z.enum(["brackets", "flat"]),
  flatRate: z.coerce.number().min(0).max(60),
  otherIncome: money,
});

export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const input = SettingsInput.parse(Object.fromEntries(form));
    const { supabase, user } = await requireUser();
    const current = await getSettings();
    const next = { ...current, ...input, province: input.province as typeof current.province };
    const { error } = await supabase.from("business_settings").upsert(settingsToRow(user.id, next));
    if (error) throw error;
    refresh();
    return { ok: true, message: "Settings saved." };
  } catch (e) {
    return fail(e);
  }
}

const HomeInput = z.object({
  workspacePct: pct,
  rent: money,
  mortgageInterest: money,
  propertyTax: money,
  insurance: money,
  utilities: money,
  internet: money,
  maintenance: money,
}) satisfies z.ZodType<Record<(typeof HOME_COST_FIELDS)[number][0], number>>;

export async function saveHome(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const home = HomeInput.parse(Object.fromEntries(form));
    const { supabase, user } = await requireUser();
    const current = await getSettings();
    const { error } = await supabase.from("business_settings").upsert(settingsToRow(user.id, { ...current, home }));
    if (error) throw error;
    refresh();
    return { ok: true, message: "Home costs saved." };
  } catch (e) {
    return fail(e);
  }
}
