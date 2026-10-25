import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export default async function Landing() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-8 px-4 py-16">
      <div className="flex items-center gap-2.5"><Logo size={36} /><span className="font-display text-2xl font-bold">Cairn</span></div>
      <h1 className="text-4xl font-bold leading-tight">Know what to set aside for the CRA, every time you get paid.</h1>
      <p className="max-w-[60ch] text-lg text-muted">
        Cairn keeps the books for Canadian freelancers and sole proprietors. Snap receipts, track GST/HST, and see your
        income tax and CPP owing as you go, sorted into the lines of form T2125.
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          ["Set-aside number", "Income tax, CPP or QPP, and GST/HST owing, updated with every entry."],
          ["Receipts read for you", "Take a photo; Claude fills in the amount, tax and T2125 category."],
          ["Ready for tax time", "T2125 and GST/HST return summaries, plus an export for your accountant."],
        ].map(([t, d]) => (
          <li key={t} className="panel"><h3 className="mb-1 font-medium">{t}</h3><p className="note">{d}</p></li>
        ))}
      </ul>
      <div><Link href="/login" className="btn">Start your books</Link></div>
    </main>
  );
}
