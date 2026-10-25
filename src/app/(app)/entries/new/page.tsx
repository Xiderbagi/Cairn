import { getSettings } from "@/lib/data";
import { PROVINCES } from "@/lib/tax";
import { EntryForm } from "./EntryForm";

export default async function NewEntry() {
  const settings = await getSettings();
  const p = PROVINCES[settings.province];
  return (
    <EntryForm
      salesTaxName={p.salesTaxName}
      salesTaxRate={p.salesTaxRate}
      gstRegistered={settings.gstRegistered}
      receiptsEnabled={Boolean(process.env.ANTHROPIC_API_KEY)}
    />
  );
}
