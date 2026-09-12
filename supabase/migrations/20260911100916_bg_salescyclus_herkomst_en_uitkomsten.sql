-- 1. Herkomst per sessie in de eigen meting (utm-bron/-medium/-campagne of verwijzend domein; nooit persoonsgegevens)
alter table public.bg_interacties add column if not exists herkomst text check (length(herkomst) <= 160);

-- 2. Uitkomsten uit de plekken waar conversies landen, via de bestaande bg_uitkomst_vastleggen()
create table if not exists public.bg_uitkomst_bronnen_gezien (
  bron text not null, bron_id text not null, outcome_id text, vastgelegd_op timestamptz not null default now(),
  primary key (bron, bron_id)
);
alter table public.bg_uitkomst_bronnen_gezien enable row level security;
comment on table public.bg_uitkomst_bronnen_gezien is 'Ontdubbeling: welke bronregel (offerte, scan, account, Calendly-afspraak) al als uitkomst is vastgelegd. 11 sept 2026.';

create or replace function intern.bg_uitkomst_eenmalig(p_bron text, p_bron_id text, p_fase text, p_omzet numeric, p_sleutel text, p_extra jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  if exists (select 1 from public.bg_uitkomst_bronnen_gezien where bron = p_bron and bron_id = p_bron_id) then return; end if;
  v := public.bg_uitkomst_vastleggen(p_fase, null, coalesce(p_omzet, 0), p_bron, p_sleutel, null, coalesce(p_extra, '{}'::jsonb), null, null);
  insert into public.bg_uitkomst_bronnen_gezien(bron, bron_id, outcome_id) values (p_bron, p_bron_id, v->>'outcome_id') on conflict do nothing;
end $$;
revoke all on function intern.bg_uitkomst_eenmalig(text,text,text,numeric,text,jsonb) from public, anon, authenticated;

create or replace function intern.trg_offerte_uitkomst() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform intern.bg_uitkomst_eenmalig('offerte', new.id::text || ':voorstel', 'proposal', 0, 'offerte:' || coalesce(new.klant_slug, new.id::text), jsonb_build_object('titel', new.titel, 'bron_formulier', new.bron));
  if coalesce(new.getekend, false) then
    perform intern.bg_uitkomst_eenmalig('offerte', new.id::text || ':getekend', 'won_order', coalesce(new.totaal, 0), 'offerte:' || coalesce(new.klant_slug, new.id::text), jsonb_build_object('titel', new.titel, 'getekend_op', new.getekend_op));
  end if;
  return new;
end $$;
drop trigger if exists bg_offerte_uitkomst on public.offerte_inzendingen;
create trigger bg_offerte_uitkomst after insert or update of getekend on public.offerte_inzendingen for each row execute function intern.trg_offerte_uitkomst();

create or replace function intern.trg_scan_uitkomst() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform intern.bg_uitkomst_eenmalig('scan', new.id::text, 'lead', 0, 'scan:' || new.id::text, jsonb_build_object('bron_formulier', new.bron));
  return new;
end $$;
drop trigger if exists bg_scan_uitkomst on public.scan_inzendingen;
create trigger bg_scan_uitkomst after insert on public.scan_inzendingen for each row execute function intern.trg_scan_uitkomst();

create or replace function intern.trg_account_uitkomst() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform intern.bg_uitkomst_eenmalig('account', new.id::text, 'lead', 0, 'account:' || new.id::text, jsonb_build_object('soort', 'portaalaccount'));
  return new;
exception when others then return new; -- een aanmelding mag nooit mislukken door de meting
end $$;
drop trigger if exists bg_account_uitkomst on auth.users;
create trigger bg_account_uitkomst after insert on auth.users for each row execute function intern.trg_account_uitkomst();

comment on function intern.trg_offerte_uitkomst() is 'Offerte ingediend = proposal, getekend = won_order met totaal als omzet; via bg_uitkomst_vastleggen (growth_outcomes, growth_page_daily, brein). 11 sept 2026.';
