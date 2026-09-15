-- Canonical portal tenant identity: organisation FK is authority; slug is compatibility alias only.
-- Demo data is explicit and excluded from commercial benchmark/outcome learning.

alter table public.scan_inzendingen
  add column if not exists organisatie_id uuid,
  add column if not exists is_demo boolean not null default false;

alter table public.offerte_inzendingen
  add column if not exists organisatie_id uuid,
  add column if not exists is_demo boolean not null default false;

alter table public.portaal_stand
  add column if not exists organisatie_id uuid;

update public.scan_inzendingen
set is_demo = true,
    organisatie_id = null
where klant_slug = 'demo';

update public.offerte_inzendingen
set is_demo = true,
    organisatie_id = null
where klant_slug = 'demo';

update public.scan_inzendingen s
set organisatie_id = o.id,
    klant_slug = o.slug,
    is_demo = false
from public.organisaties o
where s.klant_slug = o.slug
  and s.klant_slug <> 'demo';

update public.offerte_inzendingen f
set organisatie_id = o.id,
    klant_slug = o.slug,
    is_demo = false
from public.organisaties o
where f.klant_slug = o.slug
  and f.klant_slug <> 'demo';

update public.portaal_stand p
set organisatie_id = l.organisatie_id
from public.leden l
where l.gebruiker_id = p.gebruiker_id;

do $$
begin
  if exists (
    select 1 from public.scan_inzendingen
    where not is_demo and organisatie_id is null
  ) then
    raise exception 'Unresolved non-demo scan tenant identity';
  end if;
  if exists (
    select 1 from public.offerte_inzendingen
    where not is_demo and organisatie_id is null
  ) then
    raise exception 'Unresolved non-demo offer tenant identity';
  end if;
  if exists (
    select 1 from public.portaal_stand
    where organisatie_id is null
  ) then
    raise exception 'Unresolved portal-state tenant identity';
  end if;
end $$;

alter table public.scan_inzendingen
  drop constraint if exists scan_inzendingen_organisatie_id_fkey,
  add constraint scan_inzendingen_organisatie_id_fkey
    foreign key (organisatie_id) references public.organisaties(id),
  drop constraint if exists scan_inzendingen_tenant_truth_check,
  add constraint scan_inzendingen_tenant_truth_check
    check ((is_demo and organisatie_id is null and klant_slug = 'demo') or
           (not is_demo and organisatie_id is not null));

alter table public.offerte_inzendingen
  drop constraint if exists offerte_inzendingen_organisatie_id_fkey,
  add constraint offerte_inzendingen_organisatie_id_fkey
    foreign key (organisatie_id) references public.organisaties(id),
  drop constraint if exists offerte_inzendingen_tenant_truth_check,
  add constraint offerte_inzendingen_tenant_truth_check
    check ((is_demo and organisatie_id is null and klant_slug = 'demo') or
           (not is_demo and organisatie_id is not null));

alter table public.portaal_stand
  drop constraint if exists portaal_stand_organisatie_id_fkey,
  add constraint portaal_stand_organisatie_id_fkey
    foreign key (organisatie_id) references public.organisaties(id),
  alter column organisatie_id set not null;

create index if not exists scan_inzendingen_organisatie_id_idx on public.scan_inzendingen (organisatie_id) where organisatie_id is not null;
create index if not exists offerte_inzendingen_organisatie_id_idx on public.offerte_inzendingen (organisatie_id) where organisatie_id is not null;
create index if not exists portaal_stand_organisatie_id_idx on public.portaal_stand (organisatie_id);

create or replace function public.portal_normalize_intake_identity_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organisaties%rowtype;
begin
  if coalesce(new.is_demo, false) then
    if v_uid is not null then
      raise exception 'Authenticated customer writes cannot create demo intake data';
    end if;
    new.organisatie_id := null;
    new.klant_slug := 'demo';
    return new;
  end if;

  if v_uid is not null then
    if new.klant_slug is not null then
      select o.* into v_org
      from public.leden l
      join public.organisaties o on o.id = l.organisatie_id
      where l.gebruiker_id = v_uid and o.slug = new.klant_slug
      limit 1;
    else
      select o.* into v_org
      from public.leden l
      join public.organisaties o on o.id = l.organisatie_id
      where l.gebruiker_id = v_uid
      order by l.aangemaakt_op
      limit 1;
    end if;
    if v_org.id is null then
      raise exception 'No proven organisation membership for intake write';
    end if;
    new.organisatie_id := v_org.id;
    new.klant_slug := v_org.slug;
  else
    if new.organisatie_id is not null then
      select * into v_org from public.organisaties where id = new.organisatie_id;
    elsif new.klant_slug is not null then
      select * into v_org from public.organisaties where slug = new.klant_slug;
    end if;
    if v_org.id is null then
      raise exception 'Internal intake write requires a proven organisation';
    end if;
    new.organisatie_id := v_org.id;
    new.klant_slug := v_org.slug;
  end if;

  new.is_demo := false;
  return new;
end;
$$;

create or replace function public.portal_normalize_state_identity_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org_id uuid;
begin
  if v_uid is not null and new.gebruiker_id <> v_uid then
    raise exception 'Portal state may only be written for the authenticated user';
  end if;

  select l.organisatie_id into v_org_id
  from public.leden l
  where l.gebruiker_id = new.gebruiker_id
  order by l.aangemaakt_op
  limit 1;

  if v_org_id is null then
    raise exception 'No proven organisation membership for portal state';
  end if;

  new.organisatie_id := v_org_id;
  return new;
end;
$$;

revoke all on function public.portal_normalize_intake_identity_v1() from public, anon, authenticated;
revoke all on function public.portal_normalize_state_identity_v1() from public, anon, authenticated;

create or replace trigger scan_inzendingen_tenant_identity_v1
before insert or update of klant_slug, organisatie_id, is_demo on public.scan_inzendingen
for each row execute function public.portal_normalize_intake_identity_v1();

create or replace trigger offerte_inzendingen_tenant_identity_v1
before insert or update of klant_slug, organisatie_id, is_demo on public.offerte_inzendingen
for each row execute function public.portal_normalize_intake_identity_v1();

create or replace trigger portaal_stand_tenant_identity_v1
before insert or update of gebruiker_id, organisatie_id on public.portaal_stand
for each row execute function public.portal_normalize_state_identity_v1();

-- Replace permissive public intake writes with membership-bound authenticated writes.
drop policy if exists scan_toevoegen on public.scan_inzendingen;
drop policy if exists offerte_toevoegen on public.offerte_inzendingen;
revoke insert on public.scan_inzendingen from anon;
revoke insert on public.offerte_inzendingen from anon;

grant insert on public.scan_inzendingen to authenticated;
grant insert on public.offerte_inzendingen to authenticated;

create policy scan_toevoegen on public.scan_inzendingen
for insert to authenticated
with check (
  is_demo = false
  and organisatie_id is not null
  and exists (
    select 1 from public.leden l
    where l.gebruiker_id = auth.uid()
      and l.organisatie_id = scan_inzendingen.organisatie_id
  )
);

create policy offerte_toevoegen on public.offerte_inzendingen
for insert to authenticated
with check (
  is_demo = false
  and organisatie_id is not null
  and exists (
    select 1 from public.leden l
    where l.gebruiker_id = auth.uid()
      and l.organisatie_id = offerte_inzendingen.organisatie_id
  )
);

-- Existing portal-state policies now enforce both user and organisation membership.
drop policy if exists eigen_stand_lezen on public.portaal_stand;
drop policy if exists eigen_stand_maken on public.portaal_stand;
drop policy if exists eigen_stand_wijzigen on public.portaal_stand;
drop policy if exists eigen_stand_wissen on public.portaal_stand;

create policy eigen_stand_lezen on public.portaal_stand
for select to authenticated
using (
  gebruiker_id = auth.uid()
  and exists (select 1 from public.leden l where l.gebruiker_id = auth.uid() and l.organisatie_id = portaal_stand.organisatie_id)
);

create policy eigen_stand_maken on public.portaal_stand
for insert to authenticated
with check (
  gebruiker_id = auth.uid()
  and exists (select 1 from public.leden l where l.gebruiker_id = auth.uid() and l.organisatie_id = portaal_stand.organisatie_id)
);

create policy eigen_stand_wijzigen on public.portaal_stand
for update to authenticated
using (gebruiker_id = auth.uid())
with check (
  gebruiker_id = auth.uid()
  and exists (select 1 from public.leden l where l.gebruiker_id = auth.uid() and l.organisatie_id = portaal_stand.organisatie_id)
);

create policy eigen_stand_wissen on public.portaal_stand
for delete to authenticated
using (
  gebruiker_id = auth.uid()
  and exists (select 1 from public.leden l where l.gebruiker_id = auth.uid() and l.organisatie_id = portaal_stand.organisatie_id)
);

-- Benchmarks only learn from real rows with proven canonical tenant identity.
create or replace function benchmark_projection.refresh_scan_benchmarks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from benchmark_projection.benchmark_branche_data;
  insert into benchmark_projection.benchmark_branche_data
    (branche, aantal, score_gemiddeld, score_midden, score_bovenste_kwart)
  select branche,
         count(*),
         round(avg(score), 1),
         round(percentile_cont(0.5) within group (order by score::double precision)::numeric, 1),
         round(percentile_cont(0.75) within group (order by score::double precision)::numeric, 1)
  from public.scan_inzendingen
  where soort = 'frisse_blik'
    and score is not null
    and branche is not null
    and is_demo = false
    and organisatie_id is not null
  group by branche
  having count(*) >= 5;

  delete from benchmark_projection.benchmark_niveaus_data;
  insert into benchmark_projection.benchmark_niveaus_data
    (branche, onderdeel, aantal, niveau_gemiddeld)
  select s.branche,
         n.sleutel,
         count(*),
         round(avg(n.ruw::numeric), 2)
  from public.scan_inzendingen s
  cross join lateral jsonb_each_text(coalesce(s.niveaus, '{}'::jsonb)) n(sleutel, ruw)
  where s.soort = 'frisse_blik'
    and s.branche is not null
    and s.is_demo = false
    and s.organisatie_id is not null
  group by s.branche, n.sleutel
  having count(*) >= 5;

  return null;
end;
$$;

create or replace function benchmark_projection.refresh_offerte_benchmarks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from benchmark_projection.benchmark_offertes_data;
  insert into benchmark_projection.benchmark_offertes_data
    (maand, aantal, gemiddeld_bedrag, gemiddelde_doorlooptijd, getekend_percentage)
  select date_trunc('month', aangemaakt)::date,
         count(*),
         round(avg(totaal), 0),
         round(avg(weken), 1),
         round(100.0 * avg(case when getekend then 1 else 0 end), 1)
  from public.offerte_inzendingen
  where is_demo = false
    and organisatie_id is not null
  group by date_trunc('month', aangemaakt)::date
  having count(*) >= 5;

  return null;
end;
$$;

-- Commercial outcomes fail closed for demo/unowned rows and keep canonical organisation provenance.
create or replace function intern.trg_scan_uitkomst()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_demo or new.organisatie_id is null then
    return new;
  end if;
  perform intern.bg_uitkomst_eenmalig(
    'scan', new.id::text, 'lead', 0, 'scan:' || new.id::text,
    jsonb_build_object('bron_formulier', new.bron, 'organisatie_id', new.organisatie_id, 'tenant_authority', 'organisaties.id')
  );
  return new;
end;
$$;

create or replace function intern.trg_offerte_uitkomst()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_demo or new.organisatie_id is null then
    return new;
  end if;
  perform intern.bg_uitkomst_eenmalig(
    'offerte', new.id::text || ':voorstel', 'proposal', 0,
    'offerte:' || coalesce(new.klant_slug, new.id::text),
    jsonb_build_object('titel', new.titel, 'bron_formulier', new.bron, 'organisatie_id', new.organisatie_id, 'tenant_authority', 'organisaties.id')
  );
  if coalesce(new.getekend, false) then
    perform intern.bg_uitkomst_eenmalig(
      'offerte', new.id::text || ':getekend', 'won_order', coalesce(new.totaal, 0),
      'offerte:' || coalesce(new.klant_slug, new.id::text),
      jsonb_build_object('titel', new.titel, 'getekend_op', new.getekend_op, 'organisatie_id', new.organisatie_id, 'tenant_authority', 'organisaties.id')
    );
  end if;
  return new;
end;
$$;

insert into public.powerhouse_sales_learnings
  (fingerprint, subject_key, scope, hypothesis, evidence, effect, confidence, status, sample_size, updated_at)
values (
  'portal-tenant-identity-normalization-v1',
  'portal-tenant-identity',
  'system',
  'Free-text tenant aliases and permissive intake INSERT policies cannot be authoritative customer identity.',
  jsonb_build_object(
    'root_cause', 'scan/offerte used klant_slug without organisatie FK; portaal_stand was user-scoped; intake INSERT policies allowed WITH CHECK true',
    'historical_demo_rows', 6,
    'authority', 'public.organisaties.id'
  ),
  jsonb_build_object(
    'prevention_rule', 'Customer-domain rows carry canonical organisatie_id; auth membership authorizes writes; slug is alias only; demo is explicit and excluded from benchmarks/outcomes.',
    'reuse_first', true,
    'new_store_created', false,
    'new_scheduler_created', false
  ),
  1.0,
  'proven',
  14,
  now()
)
on conflict (fingerprint) do update
set evidence = excluded.evidence,
    effect = excluded.effect,
    confidence = excluded.confidence,
    status = excluded.status,
    sample_size = excluded.sample_size,
    updated_at = now();

insert into public.powerhouse_runtime_events
  (dedupe_key, event_type, source, subject_key, evidence, context, state, data_quality, confidence, updated_at)
values (
  'portal-tenant-identity-normalization-v1:activation',
  'portal_tenant_identity_normalized',
  'supabase-migration',
  'portal-tenant-identity',
  jsonb_build_object('authority', 'public.organisaties.id', 'demo_explicit', true, 'benchmark_fail_closed', true, 'outcome_fail_closed', true),
  jsonb_build_object('contract', 'portal-tenant-identity-normalization-v1'),
  'actioned',
  'verified',
  1.0,
  now()
)
on conflict (dedupe_key) do update
set evidence = excluded.evidence,
    context = excluded.context,
    state = excluded.state,
    data_quality = excluded.data_quality,
    confidence = excluded.confidence,
    updated_at = now();
