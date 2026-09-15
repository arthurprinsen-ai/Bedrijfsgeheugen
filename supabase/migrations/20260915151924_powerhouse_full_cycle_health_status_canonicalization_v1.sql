-- Canonicalize the production-proven Powerhouse health-status contract.
-- Root cause: bg_gezondheid_status_check accepts only lowercase values while a
-- writer previously emitted a non-normalized status.
-- Prevention is enforced at the canonical table boundary so every current and
-- future writer gets the same fail-closed contract: ok | waarschuwing | fout.

update public.bg_gezondheid
set status = lower(status)
where status is not null
  and status <> lower(status)
  and lower(status) in ('ok','waarschuwing','fout');

create or replace function public.bg_gezondheid_normalize_status()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  if new.status is null then
    raise exception 'bg_gezondheid.status must not be null';
  end if;

  new.status := lower(trim(new.status));

  if new.status not in ('ok','waarschuwing','fout') then
    raise exception 'invalid bg_gezondheid.status: %', new.status;
  end if;

  return new;
end;
$function$;

drop trigger if exists bg_gezondheid_normalize_status_before_write on public.bg_gezondheid;
create trigger bg_gezondheid_normalize_status_before_write
before insert or update of status on public.bg_gezondheid
for each row
execute function public.bg_gezondheid_normalize_status();

alter table public.bg_gezondheid
  drop constraint if exists bg_gezondheid_status_check;

alter table public.bg_gezondheid
  add constraint bg_gezondheid_status_check
  check (status = any (array['ok'::text,'waarschuwing'::text,'fout'::text]));

-- Regression assertion: no invalid persisted status may survive this migration.
do $$
begin
  if exists (
    select 1
    from public.bg_gezondheid
    where status is null or status not in ('ok','waarschuwing','fout')
  ) then
    raise exception 'bg_gezondheid contains a status outside the canonical lowercase contract';
  end if;
end
$$;
