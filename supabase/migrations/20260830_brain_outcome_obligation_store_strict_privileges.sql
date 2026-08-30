-- Close the remaining service_role privilege surface on the append-only outcome-obligation ledgers.
-- REVOKE ALL is required because default/legacy grants may include TRUNCATE, TRIGGER or REFERENCES.

revoke all on table public.brain_outcome_obligation_dispatch from service_role;
revoke all on table public.brain_outcome_obligation_evidence from service_role;

grant select, insert on table public.brain_outcome_obligation_dispatch to service_role;
grant select, insert on table public.brain_outcome_obligation_evidence to service_role;
