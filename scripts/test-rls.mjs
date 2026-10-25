// Applies the migrations to an in-memory Postgres with stub Supabase auth/storage schemas,
// then checks that row-level security keeps each user's books private.
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
await db.exec(`
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id serial primary key, bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
  create role authenticated;
  grant usage on schema public, auth, storage to authenticated;
`);
for (const f of fs.readdirSync("supabase/migrations").sort()) await db.exec(fs.readFileSync(`supabase/migrations/${f}`, "utf8"));
await db.exec(`grant all on all tables in schema public to authenticated; grant all on storage.objects to authenticated; grant usage on all sequences in schema storage to authenticated;`);
const A = "11111111-1111-1111-1111-111111111111", B = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users values ('${A}'), ('${B}')`);
const as = async (uid, sql) => { await db.exec(`reset role; set test.uid = '${uid}'; set role authenticated;`); return db.query(sql); };
let failed = 0;
const check = (label, cond) => { if (!cond) failed++; console.log(cond ? "PASS" : "FAIL", label); };

await as(A, `insert into transactions (type, date, description, amount, category) values ('expense', '2026-01-02', 'A lunch', 50, '8523')`);
await as(B, `insert into transactions (type, date, description, amount) values ('income', '2026-01-03', 'B invoice', 900)`);
check("user A sees only own transactions", (await as(A, `select description from transactions`)).rows.map(r=>r.description).join() === "A lunch");
check("user B sees only own transactions", (await as(B, `select description from transactions`)).rows.map(r=>r.description).join() === "B invoice");
let blocked = false; try { await as(A, `insert into transactions (user_id, type, date, description, amount) values ('${B}', 'income', '2026-01-03', 'forged', 1)`); } catch { blocked = true; }
check("A cannot insert rows for B", blocked);
await as(A, `delete from transactions where description = 'B invoice'`);
check("A cannot delete B's rows", (await as(B, `select count(*)::int n from transactions`)).rows[0].n === 1);
let bad = false; try { await as(A, `insert into transactions (type, date, description, amount, category) values ('income', '2026-01-02', 'x', 5, '8810')`); } catch { bad = true; }
check("income with a category is rejected", bad);
await as(A, `insert into business_settings (user_id, province) values ('${A}', 'BC')`);
check("B cannot read A's settings", (await as(B, `select * from business_settings`)).rows.length === 0);
await as(A, `insert into assets (description, cca_class, cost, year_acquired) values ('Laptop', '50', 2000, 2026)`);
check("B cannot read A's assets", (await as(B, `select * from assets`)).rows.length === 0);
await as(A, `insert into storage.objects (bucket_id, name) values ('receipts', '${A}/r1.jpg')`);
let st = false; try { await as(A, `insert into storage.objects (bucket_id, name) values ('receipts', '${B}/r2.jpg')`); } catch { st = true; }
check("A cannot upload into B's receipt folder", st);
check("B cannot read A's receipts", (await as(B, `select * from storage.objects`)).rows.length === 0);
process.exit(failed ? 1 : 0);
