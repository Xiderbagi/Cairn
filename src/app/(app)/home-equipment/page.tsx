import { addAsset, deleteAsset, saveHome } from "../actions";
import { ActionForm } from "@/components/ActionForm";
import { loadBooks } from "@/lib/data";
import { money } from "@/lib/format";
import { CCA_CLASSES, HOME_COST_FIELDS, PROVINCES, summarizeYear } from "@/lib/tax";

export default async function HomeEquipment() {
  const { settings, transactions, assets } = await loadBooks();
  const s = summarizeYear(settings, transactions, assets);
  const p = PROVINCES[settings.province];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      <section className="panel flex flex-col gap-3">
        <h3 className="font-medium">Business use of home</h3>
        <ActionForm action={saveHome} submitLabel="Save home costs">
          <label className="field" htmlFor="workspacePct">Share of your home used for work (%)
            <input id="workspacePct" name="workspacePct" type="number" min="0" max="100" step="0.1" defaultValue={settings.home.workspacePct} />
          </label>
          <p className="note">Divide your workspace area by your home&apos;s total area. A 120 sq ft office in a 1,000 sq ft apartment is 12%. You can claim it if home is your main place of business, or if the space is used only for work and you meet clients there regularly.</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            {HOME_COST_FIELDS.map(([key, label]) => (
              <label key={key} className="field" htmlFor={key}>{label} (yearly)
                <input id={key} name={key} type="number" min="0" step="1" inputMode="decimal" defaultValue={settings.home[key]} />
              </label>
            ))}
          </div>
        </ActionForm>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[0.92rem]">
          <dt>Claimable this year (line 9945)</dt><dd className="num text-right">{money(s.homeOffice, 2)}</dd>
          {s.homeOfficeCarryForward > 0.005 && <><dt>Carried forward to next year</dt><dd className="num text-right">{money(s.homeOfficeCarryForward, 2)}</dd></>}
        </dl>
        <p className="note">Home costs can&apos;t push your business into a loss; anything over your profit carries forward.</p>
      </section>

      <section className="panel flex flex-col gap-3">
        <h3 className="font-medium">Equipment and vehicles (CCA)</h3>
        {s.assetCca.length ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Item</th><th>Class</th><th className="r">Cost</th><th className="r">{settings.taxYear} CCA</th><th /></tr></thead>
              <tbody>
                {s.assetCca.map(({ asset, cca }) => (
                  <tr key={asset.id}>
                    <td>{asset.description}<br /><span className="note">Bought {asset.yearAcquired}{asset.businessUsePct < 100 && ` · ${asset.businessUsePct}% business`}</span></td>
                    <td className="num">{asset.ccaClass}</td>
                    <td className="r">{money(asset.cost, 2)}</td>
                    <td className="r">{money(cca, 2)}</td>
                    <td>
                      <form action={deleteAsset}>
                        <input type="hidden" name="id" value={asset.id} />
                        <button className="cursor-pointer text-muted hover:text-bad" aria-label={`Delete ${asset.description}`}>Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
                <tr><td colSpan={3} className="font-semibold">Total CCA (line 9936)</td><td className="r font-semibold">{money(s.cca, 2)}</td><td /></tr>
              </tbody>
            </table>
          </div>
        ) : <p className="text-muted">Add things that last more than a year, like a laptop, camera, desk or vehicle. Their cost is deducted over several years.</p>}
        <ActionForm action={addAsset} submitLabel="Add item" pendingLabel="Adding…" resetOnSuccess>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <label className="field col-span-full" htmlFor="asset-description">Item<input id="asset-description" name="description" required maxLength={200} placeholder="e.g. MacBook Pro 14-inch" /></label>
            <label className="field col-span-full" htmlFor="ccaClass">Class
              <select id="ccaClass" name="ccaClass">
                {Object.entries(CCA_CLASSES).map(([k, c]) => <option key={k} value={k}>Class {k} · {c.label} ({Math.round(c.rate * 100)}%)</option>)}
              </select>
            </label>
            <label className="field" htmlFor="cost">Cost before tax<input id="cost" name="cost" type="number" min="0" step="0.01" required inputMode="decimal" /></label>
            <label className="field" htmlFor="yearAcquired">Year bought<input id="yearAcquired" name="yearAcquired" type="number" min="1990" max="2035" defaultValue={settings.taxYear} /></label>
            <label className="field" htmlFor="asset-pct">Business use %<input id="asset-pct" name="businessUsePct" type="number" min="0" max="100" defaultValue={100} /></label>
          </div>
        </ActionForm>
        <p className="note">
          Items bought from 2025 get a 1.5× first-year claim under the Accelerated Investment Incentive (Budget 2025). Passenger vehicles over $38,000 are capped at that cost.
          {settings.gstRegistered && ` Claim the ${p.salesTaxName} on these as an input tax credit${settings.gstMethod === "quick" ? ", which the quick method still allows for equipment" : ""}.`}
        </p>
      </section>
    </div>
  );
}
