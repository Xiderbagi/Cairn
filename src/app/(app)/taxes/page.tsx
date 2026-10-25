import { loadBooks } from "@/lib/data";
import { money } from "@/lib/format";
import { PROVINCES, pensionPlan, quickMethodComparison, quickMethodRate, selfEmployedPension, summarizeYear, t2125Lines } from "@/lib/tax";

export default async function Taxes() {
  const { settings, transactions, assets } = await loadBooks();
  const s = summarizeYear(settings, transactions, assets);
  const p = PROVINCES[settings.province];
  const plan = pensionPlan(settings.province);
  const quick = settings.gstMethod === "quick";
  const comparison = !quick ? quickMethodComparison(settings, s) : null;
  const regularOwing = s.salesTaxCollected - s.inputTaxCredits;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      <section className="panel">
        <h3 className="mb-3 font-medium">Form T2125 summary, {settings.taxYear}</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Line</th><th>Description</th><th className="r">Amount</th></tr></thead>
            <tbody>
              {t2125Lines(s).map((l) => (
                <tr key={l.line} className={l.line === "9369" ? "font-semibold" : undefined}>
                  <td className="num">{l.line}</td><td>{l.label}</td><td className="r">{money(l.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note mt-3">Meals are already cut to 50%. Amounts reflect your business-use percentages. CCA and home office come from the Home &amp; equipment tab.</p>
      </section>

      <section className="panel">
        <h3 className="mb-3 font-medium">Income tax estimate, {settings.taxYear}</h3>
        {s.tax.detail ? (
          <>
            <table className="data-table"><tbody>
              <tr><td>Other income</td><td className="r">{money(settings.otherIncome, 2)}</td></tr>
              <tr><td>Net business income</td><td className="r">{money(Math.max(0, s.netIncome), 2)}</td></tr>
              <tr><td>Less {plan} deduction</td><td className="r">{money(selfEmployedPension(Math.max(0, s.netIncome), settings.province).deduction, 2)}</td></tr>
              <tr><td>Taxable income</td><td className="r">{money(s.tax.detail.taxableIncome, 2)}</td></tr>
              <tr><td>Federal tax{settings.province === "QC" && " (after 16.5% Quebec abatement)"}</td><td className="r">{money(s.tax.detail.federal, 2)}</td></tr>
              <tr><td>{p.name} tax{settings.province === "ON" && " (incl. surtax)"}</td><td className="r">{money(s.tax.detail.provincial, 2)}</td></tr>
              <tr><td>{plan} contributions</td><td className="r">{money(s.tax.pension, 2)}</td></tr>
              <tr className="font-semibold"><td>Extra tax and {plan} from your business</td><td className="r">{money(s.tax.incomeTax + s.tax.pension, 2)}</td></tr>
            </tbody></table>
            <p className="note mt-3">Uses 2026 brackets and basic personal amounts only. Other credits (RRSP, tuition, dependants) lower the real number{settings.province === "ON" && "; the Ontario Health Premium is not included"}.</p>
          </>
        ) : <p>You&apos;re using a flat {settings.flatRate}% rate. Switch to 2026 tax brackets in Settings for a closer estimate.</p>}
      </section>

      <section className="panel flex flex-col gap-3">
        <h3 className="font-medium">{p.salesTaxName} return, {settings.taxYear}</h3>
        {!settings.gstRegistered ? (
          <p>You&apos;re not registered for {p.salesTaxName}. See the registration meter on the Overview tab.</p>
        ) : quick ? (
          <>
            <table className="data-table"><tbody>
              <tr><td className="num">101</td><td>Sales including {p.salesTaxName}</td><td className="r">{money(s.quickMethodBase, 2)}</td></tr>
              <tr><td /><td>× {(quickMethodRate(settings.province, settings.supplyType) * 100).toFixed(1)}% remittance rate, less 1% credit on first $30,000</td><td /></tr>
              <tr><td className="num">105</td><td>{p.salesTaxName} to remit</td><td className="r">{money(s.salesTaxOwing, 2)}</td></tr>
              <tr><td className="num">108</td><td>Input tax credits (equipment only)</td><td className="r">{money(0, 2)}</td></tr>
              <tr className="font-semibold"><td className="num">109</td><td>Net tax owing</td><td className="r">{money(s.salesTaxOwing, 2)}</td></tr>
            </tbody></table>
            <p className="note">The quick method keeps <strong className="num">{money(s.quickMethodGain, 2)}</strong> of the {p.salesTaxName} you collected; that gain is taxable income (T2125 line 8230). The regular method would owe <span className="num">{money(regularOwing, 2)}</span>. {p.separateSalesTax}</p>
          </>
        ) : (
          <>
            <table className="data-table"><tbody>
              <tr><td className="num">101</td><td>Sales and other revenue</td><td className="r">{money(s.revenue, 2)}</td></tr>
              <tr><td className="num">105</td><td>{p.salesTaxName} collected</td><td className="r">{money(s.salesTaxCollected, 2)}</td></tr>
              <tr><td className="num">108</td><td>Input tax credits</td><td className="r">{money(s.inputTaxCredits, 2)}</td></tr>
              <tr className="font-semibold"><td className="num">109</td><td>{s.salesTaxOwing >= 0 ? "Net tax owing" : "Refund"}</td><td className="r">{money(Math.abs(s.salesTaxOwing), 2)}</td></tr>
            </tbody></table>
            <p className="note">
              Regular method.{" "}
              {comparison != null && comparison < regularOwing - 1 && `The quick method would owe about ${money(comparison)} instead of ${money(regularOwing)}, though the difference counts as taxable income. You can switch in Settings. `}
              {p.separateSalesTax}
            </p>
          </>
        )}
        <div><a href={`/api/export?year=${settings.taxYear}`} className="btn">Export for my accountant (CSV)</a></div>
      </section>
    </div>
  );
}
