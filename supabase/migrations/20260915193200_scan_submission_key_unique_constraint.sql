-- Canonical scan idempotency invariant.
-- Runtime ingestion uses ON CONFLICT (submission_key), so the database must
-- enforce uniqueness for non-null canonical submission keys. Historical rows
-- with a NULL key remain valid and are not rewritten or silently claimed.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_inzendingen_submission_key_key'
      and conrelid = 'public.scan_inzendingen'::regclass
  ) then
    alter table public.scan_inzendingen
      add constraint scan_inzendingen_submission_key_key unique (submission_key);
  end if;
end
$$;
