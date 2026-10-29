-- CRO measurement receipt idempotency. Additive; existing telemetry rows remain unchanged.
-- Must be applied before the bg-interactie Edge Function and assets/meting.js release.
ALTER TABLE public.bg_interacties
  ADD COLUMN IF NOT EXISTS event_uid text;

-- Unique nullable UID: historical events without an UID remain valid.
-- Required by PostgREST on_conflict=event_uid for idempotent replay after timeouts.
CREATE UNIQUE INDEX IF NOT EXISTS bg_interacties_event_uid_unique
  ON public.bg_interacties (event_uid);

COMMENT ON COLUMN public.bg_interacties.event_uid IS
  'Random client event UUID to make retries idempotent; no user identifier, value, IP, or content.';

-- Existing RLS and service-only ingestion authorization remain unchanged.
