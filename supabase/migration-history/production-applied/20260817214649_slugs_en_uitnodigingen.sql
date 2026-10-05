alter table public.organisaties add column if not exists slug text unique;

-- Vooraf vastleggen wie bij welke organisatie hoort, vóórdat diegene ooit inlogt
create table if not exists public.uitnodigingen (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  organisatie_id uuid not null references public.organisaties(id) on delete cascade,
  rol text not null default 'lid' check (rol in ('eigenaar','lid')),
  aangemaakt_op timestamptz not null default now(),
  gebruikt_op timestamptz,
  unique (email, organisatie_id)
);

alter table public.uitnodigingen enable row level security;
create policy uitnodigingen_eigen_org on public.uitnodigingen for select to authenticated
  using (organisatie_id in (select intern.mijn_organisaties()));

-- Nieuwe gebruiker: eerst uitnodiging in de metadata, dan de uitnodigingentabel op e-mail
create or replace function intern.nieuwe_gebruiker()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org uuid;
  org_naam text;
  gevraagde_rol text := 'lid';
begin
  org := nullif(new.raw_user_meta_data ->> 'organisatie_id', '')::uuid;

  if org is not null and exists (select 1 from public.organisaties o where o.id = org) then
    gevraagde_rol := coalesce(nullif(new.raw_user_meta_data ->> 'rol', ''), 'lid');
  else
    select u.organisatie_id, u.rol into org, gevraagde_rol
    from public.uitnodigingen u
    where lower(u.email) = lower(coalesce(new.email,''))
    order by u.aangemaakt_op limit 1;
  end if;

  if gevraagde_rol not in ('eigenaar','lid') then gevraagde_rol := 'lid'; end if;

  if org is not null then
    insert into public.leden (gebruiker_id, organisatie_id, rol)
    values (new.id, org, gevraagde_rol)
    on conflict (gebruiker_id, organisatie_id) do nothing;
    update public.uitnodigingen set gebruikt_op = now()
     where organisatie_id = org and lower(email) = lower(coalesce(new.email,'')) and gebruikt_op is null;
  else
    org_naam := coalesce(
      nullif(new.raw_user_meta_data ->> 'organisatie_naam', ''),
      nullif(split_part(coalesce(new.email,''), '@', 2), ''),
      'Nieuwe organisatie'
    );
    insert into public.organisaties (naam) values (org_naam) returning id into org;
    insert into public.leden (gebruiker_id, organisatie_id, rol) values (new.id, org, 'eigenaar');
  end if;

  return new;
end;
$$;

-- Alleen naam en slug publiek: genoeg om het inlogscherm te personaliseren, verder niets
create or replace view public.portaal_publiek
with (security_invoker = true) as
select o.slug, o.naam from public.organisaties o where o.slug is not null;

create policy organisaties_slug_publiek on public.organisaties for select to anon using (slug is not null);
grant select on public.portaal_publiek to anon, authenticated;
