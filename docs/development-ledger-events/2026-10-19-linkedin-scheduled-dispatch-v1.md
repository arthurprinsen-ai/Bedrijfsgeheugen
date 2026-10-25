# 2026-10-19 — LinkedIn scheduled dispatch guard

## Failure class
PUBLICATION_SCHEDULING. LinkedIn company posting occurred at ~00:29 Amsterdam local on 19 October despite a later `scheduled_for` value. Direct LinkedIn Composio publishing had no due-time guard. Orchestrator used `+02:00` as a year-round timezone offset.

## Protected canonical change
PR #4511 adds shared schedule logic, a fail-closed LinkedIn company/personal provider guard, dynamic Amsterdam offset, and tests. Existing Powerhouse hourly scheduler and single-writer/anti-duplicate guarantees remain unchanged.

## Evidence and tests
- Historical data: company `published_at=2026-10-18T22:29:20Z`; scheduled_for `2026-10-19T06:00:00Z`
- Canonical learning: `brain/learning/2026-10-19-linkedin-scheduled-dispatch-v1.json`
- Regression tests: `tests/brain-linkedin-scheduled-dispatch-v1.test.mjs`
- Readiness: Required CI, CodeQL and exact-source Supabase production readback required
- External provider auth gap remains separate: connected LinkedIn API returns missing `r_organization_admin` (403) for org ACL queries

## Safety acceptance
No direct provider post or publication capability is issued until due. `deferred_until_due` is pending, not LIVE_PROVEN. No guaranteed success for the first next-day post until it actually happens.
