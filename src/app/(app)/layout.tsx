import { Logo } from "@/components/Logo";
import { Nav } from "@/components/Nav";
import { getSettings } from "@/lib/data";
import { PROVINCES } from "@/lib/tax";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const p = PROVINCES[settings.province];
  return (
    <div className="mx-auto max-w-[1040px] px-4 pb-12 pt-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-[1.6rem] font-bold">Cairn</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[0.78rem] font-medium">
          <span className="pill bg-accent-soft text-accent">{p.name}</span>
          <span className="pill bg-accent-soft text-accent">{settings.taxYear} tax year</span>
          <span className={`pill bg-stone-soft ${settings.gstRegistered ? "text-stone" : "text-warn"}`}>
            {settings.gstRegistered ? `${p.salesTaxName} registered` : `Not ${p.salesTaxName} registered`}
          </span>
          <form action={signOut}>
            <button className="ml-2 cursor-pointer text-muted hover:text-ink">Sign out</button>
          </form>
        </div>
      </header>
      <Nav />
      <main>{children}</main>
    </div>
  );
}
