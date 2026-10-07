# Commercial heartbeat current-set continuation v2

## Incident
The external Netlify → Supabase heartbeat became the canonical commercial scheduler owner, but the retired pg_cron topology left three continuation steps without an owner:

- current same-day action-set reconciliation;
- quality-ready LinkedIn social release;
- canonical LinkedIn autopilot dispatch.

Production evidence on 2026-10-07 showed a VERIFIED heartbeat with healthy regression gate, while output assurance remained `DEGRADED_NO_CURRENT_DAILY_ACTION_SET`. One NBA-v5 LinkedIn action was fully quality-ready but remained `prepared`.

## Structural fix
The existing external heartbeat now owns one bounded continuation:

1. promote completed fresh research to social candidates;
2. label current external NBA-v5 actions as the current daily action set;
3. release quality-ready social comments;
4. invoke the existing canonical social dispatcher;
5. run closure, terminal lineage and output assurance.

No new pg_cron job is created. The current-set reconciler mutates only evidence labels, never action status.

## Terminal proof
After protected merge:

- Supabase migration must apply on protected main;
- next external heartbeat must remain durable + VERIFIED;
- current_action_set must be non-zero when current external NBA-v5 work exists;
- the previously orphaned quality-ready action must leave `prepared` or receive an explicit terminal decision;
- fresh application 401/500/503/522 window must remain clean.
