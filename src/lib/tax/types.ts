import type { CcaClass, ExpenseLine, ProvinceCode } from "./reference";

export interface BusinessSettings {
  name: string;
  province: ProvinceCode;
  taxYear: number;
  gstRegistered: boolean;
  gstMethod: "regular" | "quick";
  supplyType: "services" | "goods";
  taxMode: "brackets" | "flat";
  flatRate: number; // percent, used when taxMode is "flat"
  otherIncome: number; // employment, pension or investment income this year
  home: HomeOffice;
}

export interface HomeOffice {
  workspacePct: number;
  rent: number;
  mortgageInterest: number;
  propertyTax: number;
  insurance: number;
  utilities: number;
  internet: number;
  maintenance: number;
}

export const HOME_COST_FIELDS = [
  ["rent", "Rent"],
  ["mortgageInterest", "Mortgage interest"],
  ["propertyTax", "Property taxes"],
  ["insurance", "Home insurance"],
  ["utilities", "Heat, electricity and water"],
  ["internet", "Internet"],
  ["maintenance", "Maintenance and repairs"],
] as const satisfies readonly (readonly [Exclude<keyof HomeOffice, "workspacePct">, string])[];

export interface Transaction {
  id: string;
  type: "income" | "expense";
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // before sales tax
  salesTax: number; // GST/HST charged or paid
  category: ExpenseLine | null; // expenses only
  businessUsePct: number; // expenses only, 0–100
}

export interface Asset {
  id: string;
  description: string;
  ccaClass: CcaClass;
  cost: number;
  yearAcquired: number;
  businessUsePct: number;
}

export const EMPTY_HOME: HomeOffice = {
  workspacePct: 0, rent: 0, mortgageInterest: 0, propertyTax: 0, insurance: 0, utilities: 0, internet: 0, maintenance: 0,
};

export const DEFAULT_SETTINGS: BusinessSettings = {
  name: "",
  province: "ON",
  taxYear: 2026,
  gstRegistered: true,
  gstMethod: "regular",
  supplyType: "services",
  taxMode: "brackets",
  flatRate: 20,
  otherIncome: 0,
  home: EMPTY_HOME,
};
