# LinkedIn scheduled dispatch, 2026-10-19

## Root cause
The canonical LinkedIn company publication for 19 October had a `scheduled_for` value of 08:00 local (06:00Z) but an external provider write around 00:29 local. The social publisher calculated `future` only for its scheduled Buffer/Instagram fallback, while direct LinkedIn/Composio provider calls did not honor the due time. Orchestrator also hard-coded a `+02:00` offset past Amsterdam's October daylight-saving transition.

## Repair and learning
- Shared Amsterdam local schedule formatting picks the correct UTC offset on the target date.
- Both company and personal LinkedIn publisher paths stop **before** pre-publish review, OAuth preflight, uniqueness reservation and provider write while the scheduled time is in the future.
- Invalid/missing LinkedIn due timestamps fail closed without consuming a publication capability or inventing a provider side effect.
- The existing hourly content loop resumes the **same** decision after it becomes due. No new scheduler, direct post or duplicate is created.
- Regression tests cover summer/winter transitions, pre-due, at-due, malformed schedules and Instagram unaffected.
- Prior published provider IDs remain terminal. Real LinkedIn org ACL currently returns HTTP 403 / missing `r_organization_admin` and is a separate provider permission issue.

## Acceptance
Protected Required CI + CodeQL, merge, exact-source Supabase LIVE readback for both functions, and a real next-day company publication respecting `scheduled_for` without duplicate. The final condition cannot be asserted before the 20 October due time.

## Safety invariant
`deferred_until_due` is a pending state, **not** LIVE_PROVEN and not a provider acknowledgement. No result from this change should be called verified until the protected merge, production source readback and a subsequent real post at/after its due time.
