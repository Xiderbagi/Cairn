"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok: boolean; message: string } | null;

const unreachable = (url: string) =>
  `Setup problem: couldn't reach Supabase at ${url}. Check NEXT_PUBLIC_SUPABASE_URL in Vercel matches your project's URL, ` +
  "that the Supabase project isn't paused, then redeploy.";

// Where the magic link should send people back to. Uses NEXT_PUBLIC_SITE_URL when set, otherwise the
// address the form was submitted from. Supabase only honours redirect URLs on its allow list.
async function siteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : "http://localhost:3000";
}

export async function sendMagicLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { ok: false, message: "Enter a valid email address." };
  const next = String(form.get("next") || "/dashboard");
  const site = await siteUrl();
  let supabaseUrl: string;
  try {
    supabaseUrl = env.supabaseUrl();
    env.supabaseAnonKey();
  } catch (e) {
    return { ok: false, message: `Setup problem: ${e instanceof Error ? e.message : "missing settings"}` };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.data,
      options: { emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/dashboard")}` },
    });
    if (error) {
      if (/fetch failed|failed to fetch|network/i.test(error.message)) {
        return { ok: false, message: unreachable(supabaseUrl) };
      }
      if (/invalid api key|jwt|apikey/i.test(error.message)) {
        return { ok: false, message: "Setup problem: Supabase rejected the key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is the publishable or anon key, then redeploy." };
      }
      return { ok: false, message: error.message };
    }
  } catch {
    return { ok: false, message: unreachable(supabaseUrl) };
  }
  return { ok: true, message: `Check ${email.data} for a sign-in link.` };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { redirect } = await import("next/navigation");
  redirect("/login");
}
