drop policy if exists "media overschrijven met sleutel" on storage.objects;
drop policy if exists "media schrijven met sleutel" on storage.objects;

create policy "media alleen toevoegen onder vaste mappen"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in ('hero','blog','social','portaal')
  );

update storage.buckets
  set file_size_limit = 33554432
  where id = 'media';