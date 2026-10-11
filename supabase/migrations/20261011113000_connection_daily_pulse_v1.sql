-- Compatibility with already-applied preview migration 20261011113000.
-- Superseded by 20261011132000_powerhouse_connection_daily_pulse_v1.sql.
-- Deliberate no-op on production: never override the canonical identity-graph cron
-- or reapply a competing connection-assessment function.
select 1;
