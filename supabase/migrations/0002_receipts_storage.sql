-- Receipt photo storage. Not used by the app yet (see docs/ROADMAP.md).
-- If the SQL editor refuses this with "must be owner of table objects", create the bucket and
-- policies from the dashboard instead: Storage → New bucket "receipts" (private), then add
-- policies limiting each user to the folder named after their user id.
-- Private receipt images, stored under receipts/<user id>/...
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

drop policy if exists "own receipts read" on storage.objects;
create policy "own receipts read" on storage.objects for select
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own receipts write" on storage.objects;
create policy "own receipts write" on storage.objects for insert
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own receipts delete" on storage.objects;
create policy "own receipts delete" on storage.objects for delete
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
