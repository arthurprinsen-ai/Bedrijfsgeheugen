-- Replay compatibility baseline: public.offertes.akkoord_door exists in production
-- before powerhouse_structure_hygiene_v1 creates its FK index during fresh branch replay.
-- Proven production shape on 2026-09-17: uuid, nullable, no default,
-- foreign key to auth.users(id) with ON DELETE SET NULL.
alter table public.offertes
  add column if not exists akkoord_door uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.offertes'::regclass
      and conname = 'offertes_akkoord_door_fkey'
  ) then
    alter table public.offertes
      add constraint offertes_akkoord_door_fkey
      foreign key (akkoord_door) references auth.users(id) on delete set null;
  end if;
end $$;
