import { describe, expect, it } from "vitest";
import { normalizeSupabaseUrl } from "./env";

describe("normalizeSupabaseUrl", () => {
  it.each([
    ["https://abcdefghijklmnopqrst.supabase.co", "https://abcdefghijklmnopqrst.supabase.co"],
    ["https://abcdefghijklmnopqrst.supabase.co/", "https://abcdefghijklmnopqrst.supabase.co"],
    ["  abcdefghijklmnopqrst.supabase.co ", "https://abcdefghijklmnopqrst.supabase.co"],
    ["https://supabase.com/dashboard/project/abcdefghijklmnopqrst", "https://abcdefghijklmnopqrst.supabase.co"],
    ["supabase.com/dashboard/project/abcdefghijklmnopqrst/settings/api", "https://abcdefghijklmnopqrst.supabase.co"],
    ["abcdefghijklmnopqrst", "https://abcdefghijklmnopqrst.supabase.co"],
    ["https://abcdefghijklmnopqrst.supabase.co/rest/v1/", "https://abcdefghijklmnopqrst.supabase.co"],
    ["http://127.0.0.1:54321", "http://127.0.0.1:54321"],
  ])("%s", (input, expected) => expect(normalizeSupabaseUrl(input)).toBe(expected));
});
