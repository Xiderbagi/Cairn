# 2026 tax reference: verification status

Every figure lives in `src/lib/tax/reference.ts`. Before launch, check each line below against the
CRA's T4127 *Payroll Deductions Formulas* (January 2026), provincial budgets and Revenu Québec, then
mark it **Verified (official)**.

| Item | Value used | Status |
|---|---|---|
| Federal brackets and rates | 14% / 20.5% / 26% / 29% / 33%; thresholds $58,523 to $258,482 | Matches CRA's indexed 2026 values |
| Federal basic personal amount | $16,452, phasing to $14,829 | Matches CRA |
| CPP: YMPE, YAMPE, exemption | $74,600 / $85,000 / $3,500 | Confirmed in secondary sources |
| CPP self-employed rate | 11.9% base, 8% second tier | Confirmed |
| QPP self-employed rate | 12.6% (10.6% basic + 2% first additional), 8% second tier | Revenu Québec and Retraite Québec; one Retraite Québec page conflicts on the upper tier |
| BC | Lowest rate 5.6%, BPA $13,216 | Secondary sources agree |
| Nova Scotia | 1.6% indexation; thresholds $30,995 to $157,124; BPA $11,932 | NS government page |
| PEI | Thresholds $33,928 to $142,520; BPA $15,000. New 20% bracket over $200,000 starts in 2027 | PEI government and EY |
| Ontario, Alberta, Quebec, Saskatchewan, Yukon | See reference.ts | Secondary sources agree |
| Newfoundland and Labrador BPA | $13,094 | **One secondary source only** |
| Manitoba first bracket | $47,000 | **Sources conflict** ($47,000 vs $47,564) |
| Ontario surtax thresholds | $5,818 / $7,446 | **Indexed estimate** |
| New Brunswick, NWT, Nunavut brackets | See reference.ts | **Indexed estimates** |
| Quick method, NS services rate | 9.4% | 2025 MNP alert; **confirm in RC4058** |
| CCA first-year factor | 1.5× for property acquired 2025–2029 (Budget 2025, Bill C-15) | **Confirm Royal Assent**; check whether class 50 qualifies for 100% expensing |
| Class 10.1 cost cap | $38,000 | **Confirm the 2026 limit** |

## Not modelled yet

- Ontario Health Premium, Manitoba's BPA reduction above $200,000, and non-refundable credits beyond the BPA
- Coordinating CPP already paid through employment with self-employed CPP
- Quebec QST returns and Quebec's TP-80 form
- Fiscal years that do not end on December 31
