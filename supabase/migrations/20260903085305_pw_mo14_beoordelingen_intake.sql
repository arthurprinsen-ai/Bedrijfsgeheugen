create table if not exists public.pw_beoordelingen (
  id uuid primary key default gen_random_uuid(),
  assessment_id text unique not null,
  reviewer_id text not null,
  reviewer_name text,
  player_id text not null,
  player_name text,
  techniek smallint, spelinzicht smallint, verdedigen smallint, snelheid smallint,
  loopvermogen smallint, rust smallint, aanvallend smallint, communicatie smallint,
  balbezit smallint, "nietBalbezit" smallint, omschakeling smallint, moed smallint,
  "winnendeKracht" smallint, teamgedrag smallint,
  observation text,
  moment timestamptz,
  bron text default 'PW MO14-1 Coach Hub v3',
  created_at timestamptz default now()
);

create index if not exists pw_beoordelingen_player_idx on public.pw_beoordelingen (player_id, reviewer_id, moment desc);

create table if not exists public.pw_opstellingen (
  id uuid primary key default gen_random_uuid(),
  page_id text,
  naam text,
  formation text,
  lineup jsonb,
  teamfit smallint,
  assessment_count smallint,
  source text,
  moment timestamptz,
  created_at timestamptz default now()
);

alter table public.pw_beoordelingen enable row level security;
alter table public.pw_opstellingen enable row level security;

drop policy if exists pw_beoordelingen_insert_anon on public.pw_beoordelingen;
create policy pw_beoordelingen_insert_anon on public.pw_beoordelingen for insert to anon, authenticated with check (true);

drop policy if exists pw_beoordelingen_select_anon on public.pw_beoordelingen;
create policy pw_beoordelingen_select_anon on public.pw_beoordelingen for select to anon, authenticated using (true);

drop policy if exists pw_opstellingen_insert_anon on public.pw_opstellingen;
create policy pw_opstellingen_insert_anon on public.pw_opstellingen for insert to anon, authenticated with check (true);

drop policy if exists pw_opstellingen_select_anon on public.pw_opstellingen;
create policy pw_opstellingen_select_anon on public.pw_opstellingen for select to anon, authenticated using (true);
