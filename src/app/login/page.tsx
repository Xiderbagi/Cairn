import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <main className="mx-auto flex max-w-[420px] flex-col gap-6 px-4 py-20">
      <div className="flex items-center gap-2.5"><Logo /><span className="font-display text-2xl font-bold">Cairn</span></div>
      <div className="panel flex flex-col gap-4">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="note">We&apos;ll email you a link. No password needed.</p>
        {error && <p className="text-[0.88rem] text-bad">That sign-in link didn&apos;t work or has expired. Request a new one.</p>}
        <LoginForm next={next ?? "/dashboard"} />
      </div>
    </main>
  );
}
