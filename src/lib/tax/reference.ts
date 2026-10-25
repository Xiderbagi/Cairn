// Reference figures for the 2026 tax year.
//
// Federal values are CRA's indexed 2026 figures. Provincial values come from 2026 publications
// where we found them (BC, NS, PEI, Ontario, Alberta, Quebec, Saskatchewan, Yukon) and are 2025
// values indexed for inflation elsewhere. Every figure here must be checked against the CRA's
// T4127 Payroll Deductions Formulas and provincial budgets before production use — see
// docs/TAX_REFERENCE.md for the verification status of each line.

export type ProvinceCode =
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT" | "NU" | "ON" | "PE" | "QC" | "SK" | "YT";

export type Bracket = readonly [upTo: number, rate: number];

export interface Province {
  name: string;
  salesTaxRate: number; // GST or HST administered by the CRA, in percent
  salesTaxName: "GST" | "HST";
  separateSalesTax?: string; // provincial sales tax the CRA does not administer
}

export const PROVINCES: Record<ProvinceCode, Province> = {
  AB: { name: "Alberta", salesTaxRate: 5, salesTaxName: "GST" },
  BC: { name: "British Columbia", salesTaxRate: 5, salesTaxName: "GST", separateSalesTax: "PST (7%) is filed separately with the province." },
  MB: { name: "Manitoba", salesTaxRate: 5, salesTaxName: "GST", separateSalesTax: "RST (7%) is filed separately with the province." },
  NB: { name: "New Brunswick", salesTaxRate: 15, salesTaxName: "HST" },
  NL: { name: "Newfoundland and Labrador", salesTaxRate: 15, salesTaxName: "HST" },
  NS: { name: "Nova Scotia", salesTaxRate: 14, salesTaxName: "HST" },
  NT: { name: "Northwest Territories", salesTaxRate: 5, salesTaxName: "GST" },
  NU: { name: "Nunavut", salesTaxRate: 5, salesTaxName: "GST" },
  ON: { name: "Ontario", salesTaxRate: 13, salesTaxName: "HST" },
  PE: { name: "Prince Edward Island", salesTaxRate: 15, salesTaxName: "HST" },
  QC: { name: "Quebec", salesTaxRate: 5, salesTaxName: "GST", separateSalesTax: "QST (9.975%) is filed separately with Revenu Québec." },
  SK: { name: "Saskatchewan", salesTaxRate: 5, salesTaxName: "GST", separateSalesTax: "PST (6%) is filed separately with the province." },
  YT: { name: "Yukon", salesTaxRate: 5, salesTaxName: "GST" },
};

export const PROVINCE_CODES = Object.keys(PROVINCES) as ProvinceCode[];

export const FEDERAL = {
  brackets: [[58523, 0.14], [117045, 0.205], [181440, 0.26], [258482, 0.29], [Infinity, 0.33]] as Bracket[],
  // The basic personal amount phases down from the max to the min across the 26% bracket.
  bpaMax: 16452,
  bpaMin: 14829,
  creditRate: 0.14,
};

export interface ProvincialTax {
  brackets: Bracket[];
  bpa: number;
  surtax?: Bracket[]; // [threshold on provincial tax, rate] — Ontario
  federalAbatement?: number; // Quebec residents get 16.5% off basic federal tax
}

export const PROVINCIAL: Record<ProvinceCode, ProvincialTax> = {
  AB: { brackets: [[61200, 0.08], [154259, 0.10], [185111, 0.12], [246813, 0.13], [370220, 0.14], [Infinity, 0.15]], bpa: 22769 },
  BC: { brackets: [[50363, 0.056], [100728, 0.077], [115648, 0.105], [140430, 0.1229], [190405, 0.147], [265545, 0.168], [Infinity, 0.205]], bpa: 13216 },
  MB: { brackets: [[47000, 0.108], [100000, 0.1275], [Infinity, 0.174]], bpa: 15780 },
  NB: { brackets: [[52333, 0.094], [104666, 0.14], [193861, 0.16], [Infinity, 0.195]], bpa: 13664 },
  NL: { brackets: [[45076, 0.087], [90150, 0.145], [160948, 0.158], [225328, 0.178], [287858, 0.198], [575718, 0.208], [1151435, 0.213], [Infinity, 0.218]], bpa: 13094 },
  NS: { brackets: [[30995, 0.0879], [61991, 0.1495], [97417, 0.1667], [157124, 0.175], [Infinity, 0.21]], bpa: 11932 },
  NT: { brackets: [[53003, 0.059], [106009, 0.086], [172346, 0.122], [Infinity, 0.1405]], bpa: 18199 },
  NU: { brackets: [[55801, 0.04], [111602, 0.07], [181439, 0.09], [Infinity, 0.115]], bpa: 19659 },
  ON: { brackets: [[53891, 0.0505], [107785, 0.0915], [150000, 0.1116], [220000, 0.1216], [Infinity, 0.1316]], bpa: 12989, surtax: [[5818, 0.20], [7446, 0.36]] },
  PE: { brackets: [[33928, 0.095], [65820, 0.1347], [106890, 0.166], [142520, 0.1762], [Infinity, 0.19]], bpa: 15000 },
  QC: { brackets: [[54345, 0.14], [108680, 0.19], [132245, 0.24], [Infinity, 0.2575]], bpa: 18952, federalAbatement: 0.165 },
  SK: { brackets: [[54532, 0.105], [155805, 0.125], [Infinity, 0.145]], bpa: 20381 },
  YT: { brackets: [[58523, 0.064], [117045, 0.09], [181440, 0.109], [500000, 0.128], [Infinity, 0.15]], bpa: 16452 },
};

// CPP outside Quebec, QPP inside. Rates are the self-employed totals (both halves).
export const PENSION_LIMITS = { ympe: 74600, yampe: 85000, basicExemption: 3500, tier2Rate: 0.08 };

export const PENSION = {
  CPP: { rate: 0.119, employerHalf: 0.0595, enhancedEmployee: 0.01, creditRate: 0.0495 },
  QPP: { rate: 0.126, employerHalf: 0.063, enhancedEmployee: 0.01, creditRate: 0.053 },
} as const;

export const GST = {
  smallSupplierThreshold: 30000,
  quickMethodMaxSales: 400000,
  quickMethodCreditRate: 0.01,
  quickMethodCreditCap: 30000,
  // Remittance rates for a permanent establishment in a province at the given sales tax rate.
  quickRates: { 5: { services: 0.036, goods: 0.018 }, 13: { services: 0.088, goods: 0.044 }, 14: { services: 0.094, goods: 0.047 }, 15: { services: 0.10, goods: 0.05 } } as Record<number, { services: number; goods: number }>,
};

export const INSTALMENT_THRESHOLD = { default: 3000, QC: 1800 };

export const CCA_CLASSES = {
  "50": { label: "Computers and hardware", rate: 0.55 },
  "8": { label: "Furniture, equipment, tools over $500", rate: 0.20 },
  "10": { label: "Vehicles", rate: 0.30 },
  "10.1": { label: "Passenger vehicle costing over $38,000", rate: 0.30, costCap: 38000 },
  "12": { label: "Software, tools under $500", rate: 1 },
  "46": { label: "Data network equipment", rate: 0.30 },
} as const satisfies Record<string, { label: string; rate: number; costCap?: number }>;

export type CcaClass = keyof typeof CCA_CLASSES;

// Form T2125 expense lines a user can pick for a transaction.
export const T2125_EXPENSE_LINES = {
  "8521": "Advertising",
  "8523": "Meals and entertainment (50%)",
  "8590": "Bad debts",
  "8690": "Insurance",
  "8710": "Interest and bank charges",
  "8760": "Business taxes, licences and memberships",
  "8810": "Office expenses",
  "8811": "Office stationery and supplies",
  "8860": "Professional fees (legal, accounting)",
  "8871": "Management and administration fees",
  "8910": "Rent",
  "8960": "Repairs and maintenance",
  "9060": "Salaries, wages and benefits",
  "9180": "Property taxes",
  "9200": "Travel expenses",
  "9220": "Telephone and utilities",
  "9224": "Fuel costs (except motor vehicles)",
  "9270": "Other expenses",
  "9275": "Delivery, freight and express",
  "9281": "Motor vehicle expenses",
  "9945": "Business-use-of-home expenses",
} as const;

export type ExpenseLine = keyof typeof T2125_EXPENSE_LINES;

export const T2125_LINE_LABELS: Record<string, string> = {
  ...T2125_EXPENSE_LINES,
  "8000": "Adjusted gross sales",
  "8230": "Other income (GST/HST quick method gain)",
  "8299": "Gross business income",
  "9368": "Total expenses",
  "9369": "Net income (loss)",
  "9936": "Capital cost allowance (CCA)",
};

export const MEALS_LINE: ExpenseLine = "8523";
export const MEALS_DEDUCTIBLE_SHARE = 0.5;
