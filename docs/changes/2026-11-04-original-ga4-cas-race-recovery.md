# Original GA4/Data Spine CAS contention repair — 4 November 2026

## Actual source failure
Supabase original `powerhouse_runtime_events`, source `bg-analytics-sync-composio`, event `ga4_failover_observed` at 2026-11-04T12:05:05.607427Z: `GA4_CANONICAL_REPAIR_CAS_FAILED:STATE_VERSION_CONFLICT`. Source route Google Analytics Data API. The real ongoing Brain `MEASUREMENT_REPAIR` obligation was already RUNNING and its version had advanced; the original Edge reader used a stale expected version. This is a concurrency defect, distinct from the actual GA4 consent-limited data absence.

## Bounded original-owner correction
Keep the existing service-role `brain_create_obligation` and `brain_transition_obligation` APIs, original GA4 sync Edge and ownership. On a genuine version conflict, read the exact canonical obligation ID again, merge fresh evidence and use its current version. At most three total attempts. Do not retry non-CAS errors, downgrade terminal states, manufacture a provider row, replay an external send, or create a parallel recovery controller.

## Required evidence
Unit regression exercises the original extracted source function with two concurrent versions, independently preserved evidence, non-CAS denial and monotonic terminal state. Original protected Required/BRAIN/CodeQL, GitHub merge, source-matched Supabase GitHub integration, and natural production GA4 retry/readback remain separate required gates. The existing GA4 source may remain `CONSENT_LIMITED`; zero sessions is not a verified zero. Record new failures through the original ONE BRAIN fingerprint `powerhouse|ga4|canonical-measurement-repair-cas-race|20261104-v1`.

No new scheduler, owner, provider fallback, credential, RLS grant, or manual production mutation.
