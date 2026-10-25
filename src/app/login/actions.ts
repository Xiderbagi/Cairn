"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok: boolean; message: string } | null;

export async function sendMagicLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { ok: false, message: "Enter a valid email address." };
  const next = String(form.get("next") || "/dashboard");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
