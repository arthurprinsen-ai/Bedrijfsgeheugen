revoke all on table public.brain_outcome_obligation_dispatch from service_role;
revoke all on table public.brain_outcome_obligation_evidence from service_role;

grant select, insert on table public.brain_outcome_obligation_dispatch to service_role;
grant select, insert on table public.brain_outcome_obligation_evidence to service_role;