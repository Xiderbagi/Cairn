import { GST, PROVINCES, type ProvinceCode } from "./reference";

export function quickMethodRate(province: ProvinceCode, supplyType: "services" | "goods"): number {
  const rates = GST.quickRates[PROVINCES[province].salesTaxRate] ?? GST.quickRates[5];
  return rates[supplyType];
}

// Quick method: remit a flat share of tax-included sales, less a 1% credit on the first $30,000.
export function quickMethodRemittance(salesIncludingTax: number, rate: number): number {
  const credit = GST.quickMethodCreditRate * Math.min(GST.quickMethodCreditCap, salesIncludingTax);
  return Math.max(0, salesIncludingTax * rate - credit);
}

// Start of the four-calendar-quarter window used for the $30,000 small-supplier test,
// counting the current quarter as the last of the four.
export function smallSupplierWindowStart(today: Date): string {
  const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
  const start = new Date(Date.UTC(today.getFullYear(), quarterStartMonth - 9, 1));
  return start.toISOString().slice(0, 10);
}
