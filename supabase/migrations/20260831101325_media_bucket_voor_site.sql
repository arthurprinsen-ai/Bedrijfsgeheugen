insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 104857600, array['video/mp4','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 104857600,
      allowed_mime_types = array['video/mp4','video/webm','image/jpeg','image/png','image/webp'];

create policy "media publiek lezen"
  on storage.objects for select
  to public
  using (bucket_id = 'media');

create policy "media schrijven met sleutel"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'media');

create policy "media overschrijven met sleutel"
  on storage.objects for update
  to anon
  using (bucket_id = 'media')
  with check (bucket_id = 'media');