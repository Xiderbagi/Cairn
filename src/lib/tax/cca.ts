import { CCA_CLASSES } from "./reference";
import type { Asset } from "./types";

// First-year factor. The half-year rule (0.5) applies unless the Accelerated Investment Incentive
// does: 1.5x for property acquired 2019–2023 and again from 2025 (Budget 2025, available for use
// before 2030); 1x for 2024 acquisitions, when the half-year rule was suspended without the boost.
export function firstYearFactor(yearAcquired: number): number {
  if ((yearAcquired >= 2019 && yearAcquired <= 2023) || (yearAcquired >= 2025 && yearAcquired <= 2029)) return 1.5;
  if (yearAcquired === 2024) return 1;
  return 0.5;
}

// Capital cost allowance for one asset in a given tax year, assuming the maximum was claimed
// every year since acquisition and nothing was sold.
export function ccaForYear(asset: Asset, taxYear: number): number {
  const cls = CCA_CLASSES[asset.ccaClass];
  if (!cls || taxYear < asset.yearAcquired) return 0;
  const cap = "costCap" in cls ? cls.costCap : Infinity;
  let ucc = Math.min(asset.cost, cap);
  let claim = 0;
  for (let y = asset.yearAcquired; y <= taxYear; y++) {
    const factor = y === asset.yearAcquired ? firstYearFactor(asset.yearAcquired) : 1;
    claim = Math.min(ucc, ucc * cls.rate * factor);
    ucc -= claim;
  }
  return claim * (asset.businessUsePct / 100);
}
