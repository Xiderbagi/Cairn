import { saveSettings } from "../actions";
import { ActionForm } from "@/components/ActionForm";
import { getSettings } from "@/lib/data";
import { PROVINCES, PROVINCE_CODES } from "@/lib/tax";

export default async function Settings() {
  const s = await getSettings();
  return (
    <section className="panel max-w-[640px]">
      <h3 className="mb-3 font-medium">Your business</h3>
      <ActionForm action={saveSettings} submitLabel="Save settings">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <label className="field col-span-full" htmlFor="name">Business name<input id="name" name="name" defaultValue={s.name} maxLength={120} placeholder="Your name or operating name" /></label>
          <label className="field" htmlFor="province">Province or territory
            <select id="province" name="province" defaultValue={s.province}>
              {PROVINCE_CODES.map((code) => <option key={code} value={code}>{PROVINCES[code].name}</option>)}
            </select>
          </label>
          <label className="field" htmlFor="taxYear">Tax year<input id="taxYear" name="taxYear" type="number" min="2020" max="2035" defaultValue={s.taxYear} /></label>
          <label className="field" htmlFor="gstRegistered">GST/HST registered?
            <select id="gstRegistered" name="gstRegistered" defaultValue={s.gstRegistered ? "yes" : "no"}><option value="yes">Yes</option><option value="no">No</option></select>
          </label>
          <label className="field" htmlFor="gstMethod">GST/HST method
            <select id="gstMethod" name="gstMethod" defaultValue={s.gstMethod}><option value="regular">Regular (claim ITCs)</option><option value="quick">Quick method</option></select>
          </label>
          <label className="field" htmlFor="supplyType">You mainly sell
            <select id="supplyType" name="supplyType" defaultValue={s.supplyType}><option value="services">Services</option><option value="goods">Goods you buy to resell</option></select>
          </label>
          <label className="field" htmlFor="taxMode">How to estimate income tax
            <select id="taxMode" name="taxMode" defaultValue={s.taxMode}><option value="brackets">2026 tax brackets</option><option value="flat">A flat rate I choose</option></select>
          </label>
          <label className="field" htmlFor="otherIncome">Other income this year ($)<input id="otherIncome" name="otherIncome" type="number" min="0" step="100" inputMode="decimal" defaultValue={s.otherIncome} /></label>
          <label className="field" htmlFor="flatRate">Flat rate (%)<input id="flatRate" name="flatRate" type="number" min="0" max="60" step="1" defaultValue={s.flatRate} /></label>
        </div>
        <p className="note">The quick method needs a CRA election (form GST74) and suits service businesses with few taxable expenses. &ldquo;You mainly sell&rdquo; only affects the quick-method rate.</p>
        <p className="note">Other income means a job, pension or investments. It pushes your business profit into higher brackets, so including it gives a truer set-aside. The flat rate is only used if you pick it above.</p>
      </ActionForm>
    </section>
  );
}
