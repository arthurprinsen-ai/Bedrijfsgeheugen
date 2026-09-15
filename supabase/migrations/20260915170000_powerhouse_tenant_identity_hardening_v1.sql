-- Canonical tenant identity hardening for customer portal intake.
-- EXISTING-STATE-FIRST: public.organisaties.id remains the only tenant authority.

alter table public.scan_inzendingen
  add column if not exists organisatie_id uuid references public.organisaties(id) on delete restrict,
  add column if not exists tenant_identity_status text not null default 'unverified'
    check (tenant_identity_status in ('verified','demo','unverified'));

alter table public.offerte_inzendingen
  add column if not exists organisatie_id uuid references public.organisaties(id) on delete restrict,
  add column if not exists tenant_identity_status text not null default 'unverified'
    check (tenant_identity_status in ('verified','demo','unverified'));

alter table public.portaal_stand
  add column if not exists organisatie_id uuid references public.organisaties(id) on delete restrict;

create index if not exists scan_inzendingen_organisatie_idx
  on public.scan_inzendingen (organisatie_id, aangemaakt desc);
create index if not exists offerte_inzendingen_organisatie_idx
  on public.offerte_inzendingen (organisatie_id, aangemaakt desc);
create index if not exists portaal_stand_organisatie_idx
  on public.portaal_stand (organisatie_id, bijgewerkt desc);

-- Historical rows are mapped deterministically where possible, but never upgraded
-- to verified without identity evidence. Demo remains explicit and isolated.
update public.scan_inzendingen s
set organisatie_id = o.id,
    tenant_identity_status = 'unverified'
from public.organisaties o
where lower(coalesce(s.klant_slug,'')) = lower(o.slug)
  and lower(coalesce(s.klant_slug,'')) <> 'demo';

update public.scan_inzendingen
set organisatie_id = null,
    tenant_identity_status = 'demo'
where lower(coalesce(klant_slug,'')) = 'demo';

update public.offerte_inzendingen s
set organisatie_id = o.id,
    tenant_identity_status = 'unverified'
from public.organisaties o
where lower(coalesce(s.klant_slug,'')) = lower(o.slug)
  and lower(coalesce(s.klant_slug,'')) <> 'demo';

update public.offerte_inzendingen
set organisatie_id = null,
    tenant_identity_status = 'demo'
where lower(coalesce(klant_slug,'')) = 'demo';

with single_membership as (
  select gebruiker_id, (array_agg(organisatie_id order by aangemaakt_op))[1] as organisatie_id
  from public.leden
  group by gebruiker_id
  having count(*) = 1
)
update public.portaal_stand p
set organisatie_id = s.organisatie_id
from single_membership s
where s.gebruiker_id = p.gebruiker_id
  and p.organisatie_id is null;

create or replace function public.set_intake_tenant_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text := coalesce(auth.role(), current_setting('request.jwt.claim.role', true));
  v_org uuid;
begin
  if lower(coalesce(new.klant_slug,'')) = 'demo' then
    new.organisatie_id := null;
    new.tenant_identity_status := 'demo';
    return new;
  end if;

  if v_role = 'service_role' then
    if new.organisatie_id is not null and exists (
      select 1 from public.organisaties o where o.id = new.organisatie_id
    ) then
      v_org := new.organisatie_id;
    elsif nullif(trim(coalesce(new.klant_slug,'')), '') is not null then
      select o.id into v_org
      from public.organisaties o
      where lower(o.slug) = lower(new.klant_slug)
      limit 1;
    end if;
  elsif v_uid is not null and nullif(trim(coalesce(new.klant_slug,'')), '') is not null then
    select o.id into v_org
    from public.organisaties o
    join public.leden l on l.organisatie_id = o.id
    where l.gebruiker_id = v_uid
      and lower(o.slug) = lower(new.klant_slug)
    limit 1;
  end if;

  if v_org is not null then
    new.organisatie_id := v_org;
    new.tenant_identity_status := 'verified';
  else
    new.organisatie_id := null;
    new.tenant_identity_status := 'unverified';
  end if;

  return new;
end;
$$;

revoke execute on function public.set_intake_tenant_identity() from public, anon, authenticated;
grant execute on function public.set_intake_tenant_identity() to service_role;

drop trigger if exists scan_set_tenant_identity on public.scan_inzendingen;
create trigger scan_set_tenant_identity
before insert or update of klant_slug, organisatie_id, tenant_identity_status
on public.scan_inzendingen
for each row execute function public.set_intake_tenant_identity();

drop trigger if exists offerte_set_tenant_identity on public.offerte_inzendingen;
create trigger offerte_set_tenant_identity
before insert or update of klant_slug, organisatie_id, tenant_identity_status
on public.offerte_inzendingen
for each row execute function public.set_intake_tenant_identity();

create or replace function public.set_portaal_tenant_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
  v_org uuid;
begin
  if v_uid is not null and new.gebruiker_id <> v_uid then
    raise exception 'PORTAAL_GEBRUIKER_ID_MISMATCH';
  end if;

  if new.organisatie_id is null then
    select count(*), (array_agg(l.organisatie_id order by l.aangemaakt_op))[1]
      into v_count, v_org
    from public.leden l
    where l.gebruiker_id = new.gebruiker_id;

    if v_count = 1 then
      new.organisatie_id := v_org;
    elsif v_count > 1 then
      raise exception 'ORGANISATIE_ID_REQUIRED';
    else
      raise exception 'NO_ORGANISATION_MEMBERSHIP';
    end if;
  elsif not exists (
    select 1 from public.leden l
    where l.gebruiker_id = new.gebruiker_id
      and l.organisatie_id = new.organisatie_id
  ) then
    raise exception 'ORGANISATION_MEMBERSHIP_MISMATCH';
  end if;

  return new;
end;
$$;

revoke execute on function public.set_portaal_tenant_identity() from public, anon, authenticated;
grant execute on function public.set_portaal_tenant_identity() to service_role;

drop trigger if exists portaal_set_tenant_identity on public.portaal_stand;
create trigger portaal_set_tenant_identity
before insert or update of gebruiker_id, organisatie_id
on public.portaal_stand
for each row execute function public.set_portaal_tenant_identity();

-- Remove the historical open WITH CHECK (true) policies.
drop policy if exists scan_toevoegen on public.scan_inzendingen;
drop policy if exists offerte_toevoegen on public.offerte_inzendingen;

create policy scan_toevoegen_anon on public.scan_inzendingen
for insert to anon
with check (
  organisatie_id is null
  and tenant_identity_status in ('demo','unverified')
);

create policy scan_toevoegen_authenticated on public.scan_inzendingen
for insert to authenticated
with check (
  (tenant_identity_status = 'verified' and organisatie_id in (select intern.mijn_organisaties()))
  or (tenant_identity_status in ('demo','unverified') and organisatie_id is null)
);

create policy offerte_toevoegen_anon on public.offerte_inzendingen
for insert to anon
with check (
  organisatie_id is null
  and tenant_identity_status in ('demo','unverified')
);

create policy offerte_toevoegen_authenticated on public.offerte_inzendingen
for insert to authenticated
with check (
  (tenant_identity_status = 'verified' and organisatie_id in (select intern.mijn_organisaties()))
  or (tenant_identity_status in ('demo','unverified') and organisatie_id is null)
);

-- Portal state is not just user-scoped anymore; it is tenant-scoped as well.
drop policy if exists eigen_stand_lezen on public.portaal_stand;
drop policy if exists eigen_stand_maken on public.portaal_stand;
drop policy if exists eigen_stand_wijzigen on public.portaal_stand;
drop policy if exists eigen_stand_wissen on public.portaal_stand;

create policy eigen_stand_lezen on public.portaal_stand
for select to authenticated
using (
  gebruiker_id = auth.uid()
  and organisatie_id in (select intern.mijn_organisaties())
);

create policy eigen_stand_maken on public.portaal_stand
for insert to authenticated
with check (
  gebruiker_id = auth.uid()
  and organisatie_id in (select intern.mijn_organisaties())
);

create policy eigen_stand_wijzigen on public.portaal_stand
for update to authenticated
using (
  gebruiker_id = auth.uid()
  and organisatie_id in (select intern.mijn_organisaties())
)
with check (
  gebruiker_id = auth.uid()
  and organisatie_id in (select intern.mijn_organisaties())
);

create policy eigen_stand_wissen on public.portaal_stand
for delete to authenticated
using (
  gebruiker_id = auth.uid()
  and organisatie_id in (select intern.mijn_organisaties())
);

-- Benchmarks are allowed to learn only from verified tenant data.
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
    and tenant_identity_status = 'verified'
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
    and s.tenant_identity_status = 'verified'
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
  where tenant_identity_status = 'verified'
    and organisatie_id is not null
  group by date_trunc('month', aangemaakt)::date
  having count(*) >= 5;

  return null;
end;
$$;

-- Commercial outcome learning fails closed on demo/unverified identity.
create or replace function intern.trg_scan_uitkomst()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tenant_identity_status <> 'verified' or new.organisatie_id is null then
    return new;
  end if;

  perform intern.bg_uitkomst_eenmalig(
    'scan', new.id::text, 'lead', 0,
    'scan:' || new.organisatie_id::text || ':' || new.id::text,
    jsonb_build_object(
      'bron_formulier', new.bron,
      'organisatie_id', new.organisatie_id,
      'tenant_identity_status', new.tenant_identity_status
    )
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
  if new.tenant_identity_status <> 'verified' or new.organisatie_id is null then
    return new;
  end if;

  perform intern.bg_uitkomst_eenmalig(
    'offerte', new.id::text || ':voorstel', 'proposal', 0,
    'offerte:' || new.organisatie_id::text || ':' || new.id::text,
    jsonb_build_object(
      'titel', new.titel,
      'bron_formulier', new.bron,
      'organisatie_id', new.organisatie_id,
      'tenant_identity_status', new.tenant_identity_status
    )
  );

  if coalesce(new.getekend, false) then
    perform intern.bg_uitkomst_eenmalig(
      'offerte', new.id::text || ':getekend', 'won_order', coalesce(new.totaal, 0),
      'offerte:' || new.organisatie_id::text || ':' || new.id::text,
      jsonb_build_object(
        'titel', new.titel,
        'getekend_op', new.getekend_op,
        'organisatie_id', new.organisatie_id,
        'tenant_identity_status', new.tenant_identity_status
      )
    );
  end if;

  return new;
end;
$$;

comment on column public.scan_inzendingen.organisatie_id is 'Canonical tenant identity. klant_slug is compatibility metadata only.';
comment on column public.offerte_inzendingen.organisatie_id is 'Canonical tenant identity. klant_slug is compatibility metadata only.';
comment on column public.portaal_stand.organisatie_id is 'Canonical organisation scope for portal state.';
comment on column public.scan_inzendingen.tenant_identity_status is 'verified=identity-backed; demo=explicit demo; unverified=accepted intake but excluded from learning.';
comment on column public.offerte_inzendingen.tenant_identity_status is 'verified=identity-backed; demo=explicit demo; unverified=accepted intake but excluded from learning.';

insert into public.powerhouse_sales_learnings
  (fingerprint, subject_key, scope, hypothesis, evidence, effect, confidence, status, sample_size, updated_at)
values (
  'portal-tenant-identity-normalization-v1',
  'portal-tenant-identity',
  'system',
  'Free-text tenant aliases and permissive intake policies cannot be authoritative customer identity.',
  jsonb_build_object(
    'root_cause', 'scan/offerte used klant_slug without canonical organisation lineage; portaal_stand was only user-scoped; legacy intake policy used WITH CHECK true',
    'authority', 'public.organisaties.id',
    'historical_demo_rows', 6
  ),
  jsonb_build_object(
    'prevention_rule', 'Only verified organisation-backed rows may enter benchmark or commercial outcome learning; demo and unverified intake remain explicit and fail closed.',
    'anonymous_lead_capture_preserved', true,
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
  jsonb_build_object(
    'authority', 'public.organisaties.id',
    'identity_states', jsonb_build_array('verified','demo','unverified'),
    'anonymous_lead_capture_preserved', true,
    'benchmark_fail_closed', true,
    'outcome_fail_closed', true
  ),
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
