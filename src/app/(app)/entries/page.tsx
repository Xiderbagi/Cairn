import Link from "next/link";
import { deleteTransaction } from "../actions";
import { getSettings, listTransactions } from "@/lib/data";
import { money } from "@/lib/format";
import { PROVINCES, T2125_EXPENSE_LINES } from "@/lib/tax";

const FILTERS = [["all", "All"], ["income", "Money in"], ["expense", "Money out"]] as const;

export default async function Entries({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "all" } = await searchParams;
  const [settings, all] = await Promise.all([getSettings(), listTransactions()]);
  const list = all.filter((t) => type === "all" || t.type === type);
  const salesTax = PROVINCES[settings.province].salesTaxName;

  return (
    <section className="panel">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-line" role="group" aria-label="Filter">
          {FILTERS.map(([key, label]) => (
            <Link key={key} href={key === "all" ? "/entries" : `/entries?type=${key}`} aria-current={type === key ? "true" : undefined}
              className={`px-3.5 py-1.5 text-[0.88rem] font-medium ${type === key ? "bg-accent text-surface" : "bg-surface text-muted"}`}>
              {label}
            </Link>
          ))}
        </div>
        <span className="note">{list.length} entries</span>
      </div>
      {list.length ? (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th className="r">Amount</th><th className="r">{salesTax}</th><th /></tr></thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td className="num">{t.date}</td>
                  <td>{t.description}{t.type === "expense" && t.businessUsePct < 100 && <span className="note"> ({t.businessUsePct}% business)</span>}</td>
                  <td>
                    {t.type === "income"
                      ? <span className="pill bg-accent-soft text-accent">Income</span>
                      : <><span className="pill bg-stone-soft text-stone">{t.category}</span> <span className="note">{t.category ? T2125_EXPENSE_LINES[t.category].replace(/ \(.*\)/, "") : ""}</span></>}
                  </td>
                  <td className="r">{money(t.amount, 2)}</td>
                  <td className="r">{money(t.salesTax, 2)}</td>
                  <td>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="cursor-pointer text-muted hover:text-bad" aria-label={`Delete ${t.description}`}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-muted">No entries here yet. <Link href="/entries/new" className="text-accent underline">Add one</Link>.</p>
      )}
    </section>
  );
}
