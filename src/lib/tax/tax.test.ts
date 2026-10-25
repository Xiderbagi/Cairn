import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  bracketTax,
  ccaForYear,
  deadlinesFor,
  estimateBusinessTax,
  firstYearFactor,
  incomeTax,
  quickMethodRemittance,
  selfEmployedPension,
  smallSupplierWindowStart,
  summarizeYear,
  t2125Lines,
  type Asset,
  type BusinessSettings,
  type Transaction,
} from "./index";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36), type: "expense", date: "2026-03-01", description: "x",
  amount: 0, salesTax: 0, category: "8810", businessUsePct: 100, ...over,
});

const settings = (over: Partial<BusinessSettings> = {}): BusinessSettings => ({ ...DEFAULT_SETTINGS, ...over });

describe("brackets", () => {
  it("taxes each slice at its own rate", () => {
    expect(bracketTax(100, [[50, 0.1], [Infinity, 0.2]])).toBeCloseTo(15);
    expect(bracketTax(0, [[50, 0.1]])).toBe(0);
  });
});

describe("CPP / QPP", () => {
  it("charges both halves of CPP on self-employment earnings", () => {
    // (50,000 - 3,500) × 11.9%
    expect(selfEmployedPension(50000, "ON").total).toBeCloseTo(5533.5, 1);
  });
  it("uses QPP's 12.6% in Quebec", () => {
    expect(selfEmployedPension(50000, "QC").total).toBeCloseTo(46500 * 0.126, 1);
  });
  it("adds the 8% second tier between YMPE and YAMPE", () => {
    const p = selfEmployedPension(90000, "ON");
    expect(p.total).toBeCloseTo((74600 - 3500) * 0.119 + (85000 - 74600) * 0.08, 1);
  });
});

describe("income tax", () => {
  it("matches the hand-checked Ontario $50k case", () => {
    // Taxable = 50,000 − 6.95% × 46,500 = 46,768.25
    // Federal = 14% × 46,768.25 − 14% × (16,452 + 4.95% × 46,500) = 3,921.78
    // Ontario = 5.05% × 46,768.25 − 5.05% × (12,989 + 2,301.75) = 1,589.60
    const r = incomeTax(0, 50000, "ON");
    expect(r.taxableIncome).toBeCloseTo(46768.25, 1);
    expect(r.federal).toBeCloseTo(3921.78, 0);
    expect(r.provincial).toBeCloseTo(1589.6, 0);
  });
  it("applies the Quebec federal abatement", () => {
    const qc = incomeTax(60000, 0, "QC");
    const fedOnly = bracketTax(60000, [[58523, 0.14], [117045, 0.205]]) - 0.14 * 16452;
    expect(qc.federal).toBeCloseTo(fedOnly * (1 - 0.165), 0);
  });
  it("adds Ontario surtax at higher incomes", () => {
    const r = incomeTax(150000, 0, "ON");
    const basic = bracketTax(150000, [[53891, 0.0505], [107785, 0.0915], [150000, 0.1116]]) - 0.0505 * 12989;
    expect(r.provincial).toBeGreaterThan(basic);
  });
  it("counts only the extra tax caused by business income", () => {
    const alone = estimateBusinessTax(30000, { province: "ON", otherIncome: 0, taxMode: "brackets", flatRate: 20 });
    const withJob = estimateBusinessTax(30000, { province: "ON", otherIncome: 60000, taxMode: "brackets", flatRate: 20 });
    expect(withJob.incomeTax).toBeGreaterThan(alone.incomeTax);
    expect(withJob.marginalRate).toBeGreaterThan(alone.marginalRate);
  });
  it("supports a flat rate", () => {
    const e = estimateBusinessTax(40000, { province: "BC", otherIncome: 0, taxMode: "flat", flatRate: 25 });
    expect(e.incomeTax).toBe(10000);
    expect(e.detail).toBeNull();
  });
});

describe("CCA", () => {
  const asset = (over: Partial<Asset>): Asset => ({ id: "a", description: "x", ccaClass: "50", cost: 3199, yearAcquired: 2026, businessUsePct: 100, ...over });
  it("uses the right first-year factor by acquisition year", () => {
    expect(firstYearFactor(2018)).toBe(0.5);
    expect(firstYearFactor(2021)).toBe(1.5);
    expect(firstYearFactor(2024)).toBe(1);
    expect(firstYearFactor(2026)).toBe(1.5);
    expect(firstYearFactor(2030)).toBe(0.5);
  });
  it("claims 82.5% of a 2026 computer in year one", () => {
    expect(ccaForYear(asset({}), 2026)).toBeCloseTo(3199 * 0.825, 2);
  });
  it("declines on the remaining balance in later years", () => {
    // 2024 desk: 160 → 128 → 102.40
    expect(ccaForYear(asset({ ccaClass: "8", cost: 800, yearAcquired: 2024 }), 2026)).toBeCloseTo(102.4, 2);
  });
  it("caps passenger vehicles and scales by business use", () => {
    expect(ccaForYear(asset({ ccaClass: "10.1", cost: 60000, yearAcquired: 2026, businessUsePct: 50 }), 2026)).toBeCloseTo(38000 * 0.45 * 0.5, 2);
  });
  it("never claims more than the cost", () => {
    expect(ccaForYear(asset({ ccaClass: "12", cost: 400 }), 2026)).toBe(400);
    expect(ccaForYear(asset({ ccaClass: "12", cost: 400 }), 2027)).toBe(0);
  });
  it("returns 0 before acquisition", () => {
    expect(ccaForYear(asset({ yearAcquired: 2027 }), 2026)).toBe(0);
  });
});

describe("GST/HST", () => {
  it("computes the quick method with the 1% credit", () => {
    expect(quickMethodRemittance(47460, 0.088)).toBeCloseTo(47460 * 0.088 - 300, 2);
    expect(quickMethodRemittance(10000, 0.036)).toBeCloseTo(260, 2);
  });
  it("finds the start of the four-quarter window", () => {
    expect(smallSupplierWindowStart(new Date(2026, 9, 25))).toBe("2026-01-01");
    expect(smallSupplierWindowStart(new Date(2026, 1, 10))).toBe("2025-04-01");
  });
});

describe("year summary", () => {
  const transactions = [
    tx({ type: "income", amount: 42000, salesTax: 5460, category: null, date: "2026-01-20" }),
    tx({ amount: 1000, salesTax: 130, category: "8810" }),
    tx({ amount: 100, salesTax: 13, category: "8523" }),
    tx({ amount: 1200, salesTax: 156, category: "9220", businessUsePct: 50 }),
    tx({ type: "income", amount: 9999, salesTax: 0, category: null, date: "2025-06-01" }),
  ];

  it("applies business use and the 50% meals rule", () => {
    const s = summarizeYear(settings(), transactions, [], new Date(2026, 9, 25));
    expect(s.revenue).toBe(42000);
    expect(s.operatingExpenses).toBeCloseTo(1000 + 50 + 600, 2);
    expect(s.inputTaxCredits).toBeCloseTo(130 + 6.5 + 78, 2);
    expect(s.salesTaxOwing).toBeCloseTo(5460 - 214.5, 2);
  });

  it("adds the quick method gain to income", () => {
    const s = summarizeYear(settings({ gstMethod: "quick" }), transactions, [], new Date(2026, 9, 25));
    expect(s.salesTaxOwing).toBeCloseTo(47460 * 0.088 - 300, 2);
    expect(s.quickMethodGain).toBeCloseTo(5460 - s.salesTaxOwing, 2);
    expect(s.netIncome).toBeCloseTo(42000 + s.quickMethodGain - s.totalExpenses, 2);
    expect(t2125Lines(s).some((l) => l.line === "8230")).toBe(true);
  });

  it("caps home office at profit and carries the rest forward", () => {
    const small = [tx({ type: "income", amount: 2000, category: null })];
    const home = { ...DEFAULT_SETTINGS.home, workspacePct: 20, rent: 24000 };
    const s = summarizeYear(settings({ home, gstRegistered: false }), small, [], new Date(2026, 9, 25));
    expect(s.homeOffice).toBe(2000);
    expect(s.homeOfficeCarryForward).toBe(2800);
    expect(s.netIncome).toBe(0);
  });

  it("includes CCA on line 9936", () => {
    const assets: Asset[] = [{ id: "a", description: "Laptop", ccaClass: "50", cost: 2000, yearAcquired: 2026, businessUsePct: 100 }];
    const s = summarizeYear(settings(), transactions, assets, new Date(2026, 9, 25));
    expect(s.expensesByLine["9936"]).toBeCloseTo(1650, 2);
  });

  it("schedules instalments only above the threshold", () => {
    const high = summarizeYear(settings(), transactions, [], new Date(2026, 9, 25));
    expect(deadlinesFor(settings(), high).filter((d) => d.title.includes("instalment"))).toHaveLength(4);
    const low = summarizeYear(settings(), [tx({ type: "income", amount: 5000, category: null })], [], new Date(2026, 9, 25));
    expect(deadlinesFor(settings(), low).some((d) => d.title.includes("instalment"))).toBe(false);
  });
});
