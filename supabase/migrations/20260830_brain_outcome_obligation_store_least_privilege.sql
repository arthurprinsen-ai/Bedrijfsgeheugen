-- Tighten the durable outcome-obligation store to explicit append-only least privilege.
-- Immutable triggers remain defense in depth; service_role itself gets no UPDATE/DELETE grant.

revoke update, delete on table public.brain_outcome_obligation_dispatch from service_role;
revoke update, delete on table public.brain_outcome_obligation_evidence from service_role;

grant select, insert on table public.brain_outcome_obligation_dispatch to service_role;
grant select, insert on table public.brain_outcome_obligation_evidence to service_role;
