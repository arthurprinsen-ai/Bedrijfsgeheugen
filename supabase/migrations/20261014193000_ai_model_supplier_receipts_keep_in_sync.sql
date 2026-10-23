-- POWERHOUSE supplier model evidence register: preserve and synchronize dual receipt copies.
-- Observed 2026-10-14: catalog_record.verification_evidence.claim_evidence drifted from
-- public.ai_model_supplier_verification_v1.claim_evidence under independent writers.
-- This is bookkeeping only; do NOT promote supplier claims, tenant governance or release.
-- Both arrays are merged by exact JSON value; historical receipts are never silently discarded.

create or replace function private.ai_model_supplier_receipts_keep_in_sync_20261014()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $fn$
declare
  e jsonb;
  merged jsonb := '[]'::jsonb;
  source_receipts jsonb;
begin
  if new.catalog_record is null or jsonb_typeof(new.catalog_record) <> 'object' then
    raise exception 'CATALOG_RECORD_MUST_BE_OBJECT';
  end if;
  for source_receipts in
    select coalesce(new.claim_evidence,'[]'::jsonb)
    union all
    select coalesce(new.catalog_record #> '{verification_evidence,claim_evidence}','[]'::jsonb)
  loop
    if jsonb_typeof(source_receipts) <> 'array' then
      raise exception 'CLAIM_RECEIPTS_MUST_BE_ARRAY';
    end if;
    for e in select value from jsonb_array_elements(source_receipts)
    loop
      if not (merged @> jsonb_build_array(e)) then
        merged := merged || jsonb_build_array(e);
      end if;
    end loop;
  end loop;
  if tg_op = 'UPDATE' then
    for source_receipts in
      select coalesce(old.claim_evidence,'[]'::jsonb)
      union all
      select coalesce(old.catalog_record #> '{verification_evidence,claim_evidence}','[]'::jsonb)
    loop
      if jsonb_typeof(source_receipts) <> 'array' then
        raise exception 'PREVIOUS_CLAIM_RECEIPTS_MUST_BE_ARRAY';
      end if;
      for e in select value from jsonb_array_elements(source_receipts)
      loop
        if not (merged @> jsonb_build_array(e)) then
          merged := merged || jsonb_build_array(e);
        end if;
      end loop;
    end loop;
  end if;
  new.claim_evidence := merged;
  new.catalog_record := jsonb_set(new.catalog_record,'{verification_evidence,claim_evidence}',merged,true);
  return new;
end;
$fn$;

create or replace trigger bg_supplier_receipts_keep_in_sync_20261014
before insert or update of claim_evidence, catalog_record
on public.ai_model_supplier_verification_v1
for each row
execute function private.ai_model_supplier_receipts_keep_in_sync_20261014();

-- No SECURITY DEFINER / no bypass of tenant RLS; no direct public invocation.
revoke all on function private.ai_model_supplier_receipts_keep_in_sync_20261014()
from public, anon, authenticated;

-- Idempotently repair rows left out of sync by earlier writers.
update public.ai_model_supplier_verification_v1
set claim_evidence = claim_evidence
where claim_evidence is distinct from catalog_record #> '{verification_evidence,claim_evidence}';

-- Deployment acceptance readback (execute separately):
-- select count(*) from public.ai_model_supplier_verification_v1
-- where claim_evidence is distinct from catalog_record #> '{verification_evidence,claim_evidence}';
-- Expected: 0. No supplier-status/release claim follows from this result.
