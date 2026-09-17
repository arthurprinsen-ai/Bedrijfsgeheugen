-- Replay compatibility baseline: public.offertes.akkoord_op exists in production
-- before powerhouse_commercial_learning_v1 depends on it during fresh branch replay.
-- Proven production shape on 2026-09-17: timestamptz, nullable, no default, no constraint.
alter table public.offertes
  add column if not exists akkoord_op timestamptz;
