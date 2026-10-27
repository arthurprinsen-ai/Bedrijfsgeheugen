
alter table public.linkedin_engagement_events
  alter column actor_linkedin_url drop not null;

alter table public.linkedin_engagement_events
  add column if not exists linkedin_notification_id bigint,
  add column if not exists organization_urn text,
  add column if not exists actor_urn text,
  add column if not exists generated_activity_urn text,
  add column if not exists last_modified_at timestamptz,
  add column if not exists signature_verified boolean not null default false;

create unique index if not exists linkedin_engagement_events_notification_uidx
  on public.linkedin_engagement_events(linkedin_notification_id)
  where linkedin_notification_id is not null;

comment on column public.linkedin_engagement_events.linkedin_notification_id
  is 'LinkedIn global notificationId; canonical dedupe key for organization social-action webhooks.';
comment on column public.linkedin_engagement_events.signature_verified
  is 'True only when X-LI-Signature has been verified against the exact raw request body.';
