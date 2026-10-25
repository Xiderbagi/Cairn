import { INSTALMENT_THRESHOLD, PROVINCES } from "./reference";
import type { BusinessSettings } from "./types";
import type { YearSummary } from "./summary";

export interface Deadline {
  date: string;
  title: string;
  note: string;
}

// Key CRA dates for a sole proprietor with a December 31 year-end who files GST/HST annually.
export function deadlinesFor(settings: BusinessSettings, summary: YearSummary): Deadline[] {
  const y = settings.taxYear;
  const salesTax = PROVINCES[settings.province].salesTaxName;
  const threshold = settings.province === "QC" ? INSTALMENT_THRESHOLD.QC : INSTALMENT_THRESHOLD.default;
  const list: Deadline[] = [];

  if (summary.tax.incomeTax + summary.tax.pension > threshold) {
    for (const md of ["03-15", "06-15", "09-15", "12-15"]) {
      list.push({
        date: `${y}-${md}`,
        title: "Quarterly tax instalment",
        note: `Required only if you owed more than $${threshold.toLocaleString("en-CA")} this year and in one of the past two. The CRA sends reminders.`,
      });
    }
  }
  if (settings.gstRegistered) {
    list.push({ date: `${y + 1}-04-30`, title: `Pay ${salesTax} owing for ${y}`, note: "Annual filers pay by April 30 even though the return is due June 15." });
  }
  list.push({ date: `${y + 1}-04-30`, title: `Pay income tax and ${settings.province === "QC" ? "QPP" : "CPP"} owing for ${y}`, note: "Interest starts after this date even if you file later." });
  list.push({ date: `${y + 1}-06-15`, title: `File your ${y} return with form T2125`, note: "Self-employed filing deadline." });
  if (settings.gstRegistered) {
    list.push({ date: `${y + 1}-06-15`, title: `File your ${y} ${salesTax} return`, note: "Annual filers with a December 31 year-end." });
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}
