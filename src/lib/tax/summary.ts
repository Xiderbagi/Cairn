import { ccaForYear } from "./cca";
import { quickMethodRate, quickMethodRemittance, smallSupplierWindowStart } from "./gst";
import { estimateBusinessTax, type BusinessTaxEstimate } from "./incomeTax";
import { GST, MEALS_DEDUCTIBLE_SHARE, MEALS_LINE, T2125_LINE_LABELS } from "./reference";
import { HOME_COST_FIELDS, type Asset, type BusinessSettings, type Transaction } from "./types";

export interface YearSummary {
  revenue: number;
  salesTaxCollected: number;
  inputTaxCredits: number;
  operatingExpenses: number;
  cca: number;
  assetCca: { asset: Asset; cca: number }[];
  homeOffice: number;
  homeOfficeCarryForward: number;
  totalExpenses: number;
  quickMethodGain: number;
  quickMethodBase: number;
  salesTaxOwing: number; // negative means a refund
  netIncome: number;
  expensesByLine: Record<string, number>;
  monthly: { income: number; expenses: number }[];
  tax: BusinessTaxEstimate;
  setAside: number;
  setAsideShare: number; // of every dollar received, including sales tax
  smallSupplier: { windowStart: string; revenue: number };
}

export function deductibleShare(t: Transaction): number {
  return (t.businessUsePct / 100) * (t.category === MEALS_LINE ? MEALS_DEDUCTIBLE_SHARE : 1);
}

export function summarizeYear(
  settings: BusinessSettings,
  transactions: Transaction[],
  assets: Asset[],
  today: Date = new Date(),
): YearSummary {
  const year = String(settings.taxYear);
  let revenue = 0, salesTaxCollected = 0, operatingExpenses = 0, inputTaxCredits = 0;
  const expensesByLine: Record<string, number> = {};
  const monthly = Array.from({ length: 12 }, () => ({ income: 0, expenses: 0 }));

  for (const t of transactions) {
    if (!t.date.startsWith(year)) continue;
    const month = Number(t.date.slice(5, 7)) - 1;
    if (t.type === "income") {
      revenue += t.amount;
      salesTaxCollected += t.salesTax;
      monthly[month].income += t.amount;
    } else {
      const share = deductibleShare(t);
      const line = t.category ?? "9270";
      operatingExpenses += t.amount * share;
      inputTaxCredits += t.salesTax * share;
      expensesByLine[line] = (expensesByLine[line] ?? 0) + t.amount * share;
      monthly[month].expenses += t.amount * share;
    }
  }

  let salesTaxOwing = 0, quickMethodGain = 0, quickMethodBase = 0;
  if (settings.gstRegistered && settings.gstMethod === "quick") {
    quickMethodBase = revenue + salesTaxCollected;
    salesTaxOwing = quickMethodRemittance(quickMethodBase, quickMethodRate(settings.province, settings.supplyType));
    quickMethodGain = salesTaxCollected - salesTaxOwing;
  } else if (settings.gstRegistered) {
    salesTaxOwing = salesTaxCollected - inputTaxCredits;
  }

  const assetCca = assets.map((asset) => ({ asset, cca: ccaForYear(asset, settings.taxYear) }));
  const cca = assetCca.reduce((sum, a) => sum + a.cca, 0);

  // Home office can't create or increase a loss; the excess carries forward.
  const homeCosts = HOME_COST_FIELDS.reduce((sum, [key]) => sum + settings.home[key], 0);
  const homeClaimable = homeCosts * Math.min(100, Math.max(0, settings.home.workspacePct)) / 100;
  const homeOffice = Math.min(homeClaimable, Math.max(0, revenue + quickMethodGain - operatingExpenses - cca));

  if (cca) expensesByLine["9936"] = cca;
  if (homeOffice) expensesByLine["9945"] = (expensesByLine["9945"] ?? 0) + homeOffice;

  const totalExpenses = operatingExpenses + cca + homeOffice;
  const netIncome = revenue + quickMethodGain - totalExpenses;
  const tax = estimateBusinessTax(netIncome, settings);
  const setAside = tax.incomeTax + tax.pension + Math.max(0, salesTaxOwing);
  const received = revenue + salesTaxCollected;

  const windowStart = smallSupplierWindowStart(today);
  const smallSupplierRevenue = transactions
    .filter((t) => t.type === "income" && t.date >= windowStart)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    revenue, salesTaxCollected, inputTaxCredits, operatingExpenses, cca, assetCca,
    homeOffice, homeOfficeCarryForward: homeClaimable - homeOffice, totalExpenses,
    quickMethodGain, quickMethodBase, salesTaxOwing, netIncome, expensesByLine, monthly, tax,
    setAside, setAsideShare: received ? setAside / received : 0,
    smallSupplier: { windowStart, revenue: smallSupplierRevenue },
  };
}

export interface T2125Line { line: string; label: string; amount: number }

export function t2125Lines(s: YearSummary): T2125Line[] {
  const row = (line: string, amount: number) => ({ line, label: T2125_LINE_LABELS[line] ?? "Other", amount });
  const lines = [row("8000", s.revenue)];
  if (s.quickMethodGain) lines.push(row("8230", s.quickMethodGain));
  lines.push(row("8299", s.revenue + s.quickMethodGain));
  for (const line of Object.keys(s.expensesByLine).sort((a, b) => Number(a) - Number(b))) {
    lines.push(row(line, s.expensesByLine[line]));
  }
  lines.push(row("9368", s.totalExpenses), row("9369", s.netIncome));
  return lines;
}

// Quick-method remittance for comparison while on the regular method; null when not eligible.
export function quickMethodComparison(settings: BusinessSettings, s: YearSummary): number | null {
  const base = s.revenue + s.salesTaxCollected;
  if (!settings.gstRegistered || !base || base > GST.quickMethodMaxSales) return null;
  return quickMethodRemittance(base, quickMethodRate(settings.province, settings.supplyType));
}
