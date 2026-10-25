import { loadBooks } from "@/lib/data";
import { PROVINCES, T2125_EXPENSE_LINES, summarizeYear, t2125Lines } from "@/lib/tax";

const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const row = (...cells: unknown[]) => cells.map((c) => (typeof c === "number" ? c.toFixed(2) : q(c))).join(",");

// Year-end CSV for an accountant: every entry, the T2125 summary, equipment, home office and GST/HST.
export async function GET(request: Request) {
  const { settings, transactions, assets } = await loadBooks();
  const year = Number(new URL(request.url).searchParams.get("year")) || settings.taxYear;
  const yearSettings = { ...settings, taxYear: year };
  const s = summarizeYear(yearSettings, transactions, assets);
  const tax = PROVINCES[settings.province].salesTaxName;

  const lines = [row("Date", "Type", "Description", "T2125 line", "Category", "Amount before tax", tax, "Business use %")];
  for (const t of transactions.filter((t) => t.date.startsWith(String(year)))) {
    lines.push(row(t.date, t.type, t.description, t.category ?? "8000", t.category ? T2125_EXPENSE_LINES[t.category] : "Sales",
      t.amount, t.salesTax, t.type === "expense" ? String(t.businessUsePct) : ""));
  }
  lines.push("", row("T2125 summary"));
  for (const l of t2125Lines(s)) lines.push(row(l.line, l.label, l.amount));
  if (s.assetCca.length) {
    lines.push("", row("Equipment", "CCA class", "Year bought", "Cost", "Business use %", `${year} CCA`));
    for (const { asset, cca } of s.assetCca) lines.push(row(asset.description, asset.ccaClass, String(asset.yearAcquired), asset.cost, String(asset.businessUsePct), cca));
  }
  if (s.homeOffice) lines.push("", row("Business-use-of-home claimed", s.homeOffice), row("Home costs carried forward", s.homeOfficeCarryForward));
  if (settings.gstRegistered && settings.gstMethod === "quick") lines.push("", row(`${tax} quick method: sales incl. tax`, s.quickMethodBase), row(`${tax} to remit`, s.salesTaxOwing));
  else if (settings.gstRegistered) lines.push("", row(`${tax} collected`, s.salesTaxCollected), row("Input tax credits", s.inputTaxCredits));

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cairn-${year}.csv"` },
  });
}
