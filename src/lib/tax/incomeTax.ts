import { FEDERAL, PENSION, PENSION_LIMITS, PROVINCIAL, type Bracket, type ProvinceCode } from "./reference";

export const pensionPlan = (province: ProvinceCode) => (province === "QC" ? "QPP" : "CPP");

export function bracketTax(income: number, brackets: readonly Bracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of brackets) {
    if (income <= lower) break;
    tax += (Math.min(income, upper) - lower) * rate;
    lower = upper;
  }
  return tax;
}

export interface PensionContribution {
  total: number; // both halves, paid with the T1 return
  deduction: number; // line 22200 + 22215
  creditBase: number; // base employee portion, claimed as a non-refundable credit
}

// CPP or QPP owed on self-employment earnings.
export function selfEmployedPension(earnings: number, province: ProvinceCode): PensionContribution {
  const p = PENSION[pensionPlan(province)];
  const { ympe, yampe, basicExemption, tier2Rate } = PENSION_LIMITS;
  const base = Math.max(0, Math.min(earnings, ympe) - basicExemption);
  const tier2 = Math.max(0, Math.min(earnings, yampe) - ympe);
  return {
    total: base * p.rate + tier2 * tier2Rate,
    deduction: base * (p.employerHalf + p.enhancedEmployee) + tier2 * tier2Rate,
    creditBase: base * p.creditRate,
  };
}

function federalBpa(taxable: number): number {
  const start = FEDERAL.brackets[2][0];
  const end = FEDERAL.brackets[3][0];
  if (taxable <= start) return FEDERAL.bpaMax;
  if (taxable >= end) return FEDERAL.bpaMin;
  return FEDERAL.bpaMax - ((FEDERAL.bpaMax - FEDERAL.bpaMin) * (taxable - start)) / (end - start);
}

export interface IncomeTaxResult {
  taxableIncome: number;
  federal: number;
  provincial: number;
  total: number;
}

// Federal + provincial tax using brackets and basic personal amounts only. Other credits
// (RRSP, tuition, dependants) and the Ontario Health Premium are not included.
export function incomeTax(otherIncome: number, businessIncome: number, province: ProvinceCode): IncomeTaxResult {
  const pension = selfEmployedPension(Math.max(0, businessIncome), province);
  const taxableIncome = Math.max(0, otherIncome + businessIncome - pension.deduction);

  let federal = Math.max(0, bracketTax(taxableIncome, FEDERAL.brackets) - FEDERAL.creditRate * (federalBpa(taxableIncome) + pension.creditBase));
  const prov = PROVINCIAL[province];
  if (prov.federalAbatement) federal *= 1 - prov.federalAbatement;

  const lowestRate = prov.brackets[0][1];
  let provincial = Math.max(0, bracketTax(taxableIncome, prov.brackets) - lowestRate * (prov.bpa + pension.creditBase));
  if (prov.surtax) {
    const basic = provincial;
    provincial += prov.surtax.reduce((sum, [threshold, rate]) => sum + Math.max(0, basic - threshold) * rate, 0);
  }
  return { taxableIncome, federal, provincial, total: federal + provincial };
}

export interface BusinessTaxEstimate {
  incomeTax: number; // extra income tax caused by the business
  pension: number; // CPP/QPP on business income
  marginalRate: number; // tax + pension on the next dollar of profit
  detail: IncomeTaxResult | null; // null in flat-rate mode
}

export function estimateBusinessTax(
  netBusinessIncome: number,
  opts: { province: ProvinceCode; otherIncome: number; taxMode: "brackets" | "flat"; flatRate: number },
): BusinessTaxEstimate {
  const biz = Math.max(0, netBusinessIncome);
  const pension = selfEmployedPension(biz, opts.province).total;
  if (opts.taxMode === "flat") {
    return { incomeTax: biz * (opts.flatRate / 100), pension, marginalRate: opts.flatRate / 100, detail: null };
  }
  const other = Math.max(0, opts.otherIncome);
  const withBiz = incomeTax(other, biz, opts.province);
  const without = incomeTax(other, 0, opts.province);
  const step = 1000;
  const next = incomeTax(other, biz + step, opts.province);
  const nextPension = selfEmployedPension(biz + step, opts.province).total;
  return {
    incomeTax: withBiz.total - without.total,
    pension,
    marginalRate: (next.total - withBiz.total + nextPension - pension) / step,
    detail: withBiz,
  };
}
