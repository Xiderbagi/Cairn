import Link from "next/link";
import { MonthlyChart } from "@/components/MonthlyChart";
import { loadBooks } from "@/lib/data";
import { formatDate, money, todayIso } from "@/lib/format";
import { GST, PROVINCES, deadlinesFor, pensionPlan, summarizeYear } from "@/lib/tax";

export default async function Dashboard() {
  const { settings, transactions, assets } = await loadBooks();
  const p = PROVINCES[settings.province];

  if (!transactions.length) {
    return (
      <section className="panel flex flex-col items-center gap-3 py-10 text-center">
        <h2 className="text-xl font-bold">No entries yet</h2>
        <p className="max-w-[48ch] text-muted">Add money you earned or spent, or snap a receipt, and Cairn will tell you what to set aside for the CRA.</p>
        <div className="flex gap-2">
          <Link href="/entries/new" className="btn">Add an entry</Link>
          <Link href="/settings" className="btn btn-ghost">Set up your business</Link>
        </div>
      </section>
    );
  }

  const s = summarizeYear(settings, transactions, assets);
  const today = todayIso();
  const upcoming = deadlinesFor(settings, s).filter((d) => d.date >= today).slice(0, 4);
  const stones = Math.max(1, Math.min(6, Math.round(s.setAsideShare * 20)));
  const ratio = s.smallSupplier.revenue / GST.smallSupplierThreshold;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-px overflow-hidden rounded-[10px] border border-line bg-line">
        {[
          [`Revenue ${settings.taxYear}`, money(s.revenue)],
          ["Deductible expenses", money(s.totalExpenses)],
          ["Net business income", money(s.netIncome)],
          [`${p.salesTaxName} you owe`, settings.gstRegistered ? money(s.salesTaxOwing) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 bg-surface px-4 py-3.5">
            <span className="label">{label}</span>
            <span className="num text-[1.35rem] font-medium">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <section className="panel">
          <span className="label">Set aside for the CRA so far</span>
          <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-[18px]">
            <div className="flex w-16 flex-col-reverse items-center gap-[3px]" aria-hidden="true">
              {Array.from({ length: stones }, (_, i) => (
                <span key={i} className="block h-3.5 rounded-[50%] bg-stone" style={{ width: 64 - i * 8 }} />
              ))}
            </div>
            <div>
              <div className="font-display text-[2.3rem] font-bold leading-tight text-stone">{money(s.setAside)}</div>
              <p className="text-muted">About <strong>{Math.round(s.setAsideShare * 100)}%</strong> of every payment you receive should go to a separate account.</p>
              <p className="note mt-1">Each extra $1,000 of profit adds about <span className="num">{money(s.tax.marginalRate * 1000)}</span> in tax and {pensionPlan(settings.province)}.</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[0.92rem]">
            <dt>{settings.taxMode === "flat" ? `Income tax (${settings.flatRate}% of net)` : `Federal + ${p.name} income tax`}</dt>
            <dd className="num text-right">{money(s.tax.incomeTax)}</dd>
            <dt>{pensionPlan(settings.province)}, both halves (self-employed)</dt>
            <dd className="num text-right">{money(s.tax.pension)}</dd>
            {settings.gstRegistered && (
              <>
                <dt>{settings.gstMethod === "quick" ? `${p.salesTaxName} to remit (quick method)` : `${p.salesTaxName} collected minus input tax credits`}</dt>
                <dd className="num text-right">{money(Math.max(0, s.salesTaxOwing))}</dd>
              </>
            )}
          </dl>
        </section>

        <section className="panel">
          <h3 className="mb-3 font-medium">Coming up</h3>
          {upcoming.length ? (
            <ul className="flex flex-col">
              {upcoming.map((d) => (
                <li key={d.date + d.title} className="grid grid-cols-[88px_1fr] gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0">
                  <span className="num text-[0.85rem]">{formatDate(d.date)}</span>
                  <span><strong>{d.title}</strong><br /><span className="note">{d.note}</span></span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted">Nothing due for this tax year.</p>}
        </section>

        <section className="panel">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-medium">Money in and out</h3>
            <div className="flex gap-3.5 text-[0.8rem] text-muted">
              <span><i className="mr-1 inline-block size-2.5 rounded-sm bg-accent" />Income</span>
              <span><i className="mr-1 inline-block size-2.5 rounded-sm bg-stone" />Expenses</span>
            </div>
          </div>
          <MonthlyChart months={s.monthly} />
        </section>

        <section className="panel flex flex-col gap-2">
          <h3 className="font-medium">{p.salesTaxName} registration</h3>
          {settings.gstRegistered ? (
            <p>You&apos;re registered, so you charge {p.salesTaxRate}% {p.salesTaxName} and claim back what you pay on business purchases. {p.separateSalesTax}</p>
          ) : (
            <>
              <p>You must register once revenue passes <strong>$30,000</strong> over four calendar quarters. Since {formatDate(s.smallSupplier.windowStart)} you&apos;ve earned <strong className="num">{money(s.smallSupplier.revenue)}</strong>.</p>
              <div className="h-2.5 overflow-hidden rounded-full bg-line">
                <i className={`block h-full rounded-full ${ratio >= 1 ? "bg-bad" : ratio >= 0.8 ? "bg-warn" : "bg-accent"}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
              </div>
              <p className="note">{ratio >= 1 ? "You're over the threshold. Register with the CRA now." : ratio >= 0.8 ? "You're close. Plan to register soon." : `${money(GST.smallSupplierThreshold - s.smallSupplier.revenue)} to go.`}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
