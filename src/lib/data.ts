import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_SETTINGS,
  EMPTY_HOME,
  type Asset,
  type BusinessSettings,
  type CcaClass,
  type ExpenseLine,
  type HomeOffice,
  type ProvinceCode,
  type Transaction,
} from "@/lib/tax";

// Rows come back from Postgres with numeric columns as strings.
const num = (v: unknown) => (v == null ? 0 : Number(v));

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getSettings(): Promise<BusinessSettings> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("business_settings").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;
  const home = (data.home ?? {}) as Partial<HomeOffice>;
  return {
    name: data.name,
    province: data.province as ProvinceCode,
    taxYear: data.tax_year,
    gstRegistered: data.gst_registered,
    gstMethod: data.gst_method,
    supplyType: data.supply_type,
    taxMode: data.tax_mode,
    flatRate: num(data.flat_rate),
    otherIncome: num(data.other_income),
    home: { ...EMPTY_HOME, ...Object.fromEntries(Object.entries(home).map(([k, v]) => [k, num(v)])) },
  };
}

export function settingsToRow(userId: string, s: BusinessSettings) {
  return {
    user_id: userId,
    name: s.name,
    province: s.province,
    tax_year: s.taxYear,
    gst_registered: s.gstRegistered,
    gst_method: s.gstMethod,
    supply_type: s.supplyType,
    tax_mode: s.taxMode,
    flat_rate: s.flatRate,
    other_income: s.otherIncome,
    home: s.home,
    updated_at: new Date().toISOString(),
  };
}

export async function listTransactions(): Promise<Transaction[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, date, description, amount, sales_tax, category, business_use_pct")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    type: r.type,
    date: r.date,
    description: r.description,
    amount: num(r.amount),
    salesTax: num(r.sales_tax),
    category: r.category as ExpenseLine | null,
    businessUsePct: r.business_use_pct,
  }));
}

export async function listAssets(): Promise<Asset[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("assets")
    .select("id, description, cca_class, cost, year_acquired, business_use_pct")
    .order("created_at");
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    description: r.description,
    ccaClass: r.cca_class as CcaClass,
    cost: num(r.cost),
    yearAcquired: r.year_acquired,
    businessUsePct: r.business_use_pct,
  }));
}

export async function loadBooks() {
  const [settings, transactions, assets] = await Promise.all([getSettings(), listTransactions(), listAssets()]);
  return { settings, transactions, assets };
}
