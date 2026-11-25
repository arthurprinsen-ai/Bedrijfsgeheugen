-- Allow the canonical social publisher to atomically claim content_ready work
-- before any external provider side effect.
alter table public.powerhouse_channel_decisions
  drop constraint if exists powerhouse_channel_decisions_state_chk;

alter table public.powerhouse_channel_decisions
  add constraint powerhouse_channel_decisions_state_chk
  check (
    state = any (
      array[
        'decided'::text,
        'content_ready'::text,
        'dispatching'::text,
        'scheduled'::text,
        'published'::text,
        'measured'::text,
        'learned'::text,
        'blocked'::text,
        'failed'::text,
        'skipped'::text
      ]
    )
  );
