"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok: boolean; message: string } | null;

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
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/dashboard")}` },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Check ${email.data} for a sign-in link.` };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { redirect } = await import("next/navigation");
  redirect("/login");
}
