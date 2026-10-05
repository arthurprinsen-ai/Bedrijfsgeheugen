-- Fingerprint: powerhouse-structure-hygiene-v2
alter table public.content_publication_obligations
  drop constraint if exists content_publication_obligatio_tenant_id_publication_date_ch_key;
alter table public.content_publication_obligations
  add constraint content_publication_obligations_pkey
  primary key (tenant_id, publication_date, channel);
alter table public.powerhouse_revenue_command_center_snapshot_v1
  alter column revenue_rank set not null;
alter table public.powerhouse_revenue_command_center_snapshot_v1
  add constraint powerhouse_revenue_command_center_snapshot_v1_pkey
  primary key (revenue_rank);
