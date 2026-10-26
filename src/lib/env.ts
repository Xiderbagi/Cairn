function required(name: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
  return value.trim();
}

// Accept the common ways people paste the Supabase address and turn them into the API URL:
// a dashboard link, a bare host, a project ID, or a URL with a trailing slash.
export function normalizeSupabaseUrl(raw: string): string {
  let v = raw.trim().replace(/^["']|["']$/g, "");
  const dashboard = v.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboard) return `https://${dashboard[1].toLowerCase()}.supabase.co`;
  if (/^[a-z0-9]{15,30}$/i.test(v)) return `https://${v.toLowerCase()}.supabase.co`;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const url = new URL(v);
    return `${url.protocol}//${url.host}`;
  } catch {
    return v;
  }
}

// Read lazily so `next build` works without secrets; a missing value fails at the first request.
export const env = {
  supabaseUrl: () => normalizeSupabaseUrl(required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};
