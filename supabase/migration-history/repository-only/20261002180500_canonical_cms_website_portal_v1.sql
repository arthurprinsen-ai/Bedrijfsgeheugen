-- Canonical CMS for Bedrijfsgeheugen website + portal.
-- Service-only write/read authority; public delivery goes through the controlled CMS gateway.

create table if not exists public.cms_content_items (
  id uuid primary key default gen_random_uuid(),
  surface text not null check (surface in ('website','portal','shared')),
  locale text not null default 'nl-NL',
  route text not null default '*',
  area text not null default 'content',
  element_key text not null,
  element_type text not null default 'text'
    check (element_type in ('text','html','link','image','meta','attribute','toggle','structured')),
  selector text,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  updated_by text,
  constraint cms_content_items_unique_key unique (surface, locale, route, element_key)
);

create index if not exists cms_content_items_public_lookup_idx
  on public.cms_content_items (status, locale, route, surface, sort_order);

create index if not exists cms_content_items_area_idx
  on public.cms_content_items (surface, area, route, locale);

create table if not exists public.cms_content_revisions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.cms_content_items(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  change_kind text not null default 'save'
    check (change_kind in ('create','save','publish','archive','restore')),
  changed_by text,
  created_at timestamptz not null default now(),
  constraint cms_content_revisions_item_version unique (item_id, version)
);

create index if not exists cms_content_revisions_item_idx
  on public.cms_content_revisions (item_id, version desc);

alter table public.cms_content_items enable row level security;
alter table public.cms_content_revisions enable row level security;

revoke all on table public.cms_content_items from anon, authenticated;
revoke all on table public.cms_content_revisions from anon, authenticated;
grant select, insert, update, delete on table public.cms_content_items to service_role;
grant select, insert on table public.cms_content_revisions to service_role;

comment on table public.cms_content_items is
  'Canonical CMS authority for website, portal and shared presentation content. Browser clients never access this table directly.';
comment on table public.cms_content_revisions is
  'Append-only CMS revision evidence. One immutable snapshot per item version.';

insert into public.cms_content_items
(surface,locale,route,area,element_key,element_type,selector,content,status,sort_order,updated_by,published_at)
values
('shared','nl-NL','*','brand','shared.brand.name','text','.bgvoet-merk, .brand-row strong, .brand strong',
 '{"text":"Bedrijfsgeheugen"}'::jsonb,'draft',10,'cms-bootstrap',null),
('shared','nl-NL','*','contact','shared.contact.email','link','a[href^="mailto:arthur@bedrijfsgeheugen.nl"]',
 '{"text":"arthur@bedrijfsgeheugen.nl","href":"mailto:arthur@bedrijfsgeheugen.nl"}'::jsonb,'draft',20,'cms-bootstrap',null),
('shared','nl-NL','*','contact','shared.contact.phone','link','a[href^="tel:+31627483345"]',
 '{"text":"06 2748 3345","href":"tel:+31627483345"}'::jsonb,'draft',30,'cms-bootstrap',null),
('website','nl-NL','/','seo','website.home.title','text','title',
 '{"text":"Kennis borgen en systemen koppelen | Bedrijfsgeheugen"}'::jsonb,'draft',10,'cms-bootstrap',null),
('website','nl-NL','/','seo','website.home.description','meta','meta[name="description"]',
 '{"content":"Kennis borgen, processen verbeteren en systemen koppelen voor mkb-bedrijven."}'::jsonb,'draft',20,'cms-bootstrap',null),
('portal','nl-NL','*','navigation','portal.nav.manage','text','[data-route="admin"] span:last-child, [data-mobile-route="Beheer"]',
 '{"text":"Beheer"}'::jsonb,'draft',10,'cms-bootstrap',null)
on conflict (surface,locale,route,element_key) do nothing;
