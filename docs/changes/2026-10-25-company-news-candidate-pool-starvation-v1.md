# Recover company-news candidate starvation — 2026-10-25

Parent-P0: #4198
Fingerprint: `growth|company-news|top-200-before-30d-filter-starvation|20261025-v1`
Obligation-ID: `growth:company-news-eligible-candidate-coverage:20261025-v1`
Delivery-Lane: backend

## Root cause from real production
At 2026-10-25 06:31 UTC, existing cron #20 finished and the provider response was HTTP 200 but only `bedrijven:5, nieuws:0`. The latest accepted news stored in `bg_bedrijfsnieuws` is 2026-10-12. `bg_inhaak_kandidaten` returns exactly 200 candidate people because it caps `p_limiet` at 200. The consumer `bg_bedrijven_voor_nieuws` subsequently excludes companies checked in 30 days; filtering **after** truncating the best 200 causes starvation.

## Bounded same-owner repair
Use the same helper with an explicit 1500-person internal candidate pool before applying the **unchanged** 30-day company filter, while preserving the existing customer/relationship protections, score-based priority, candidate metadata, Dutch eligibility and `p_limiet <= 20` returned companies. The existing `bg-bedrijfsnieuws` provider producer still defaults to 15 companies/day and there is no new pg_cron, sender, queue or special access path.

## Proof
- SQL regression checks exact upper bound, cooldown, suppression and unchanged provider result cap.
- Migration must pass existing Supabase migration checks, Required/CodeQL and protected merge.
- After deployment, compare actual `net._http_response` for original cron #20: `bedrijven` should approach configured 15 when enough eligible unique companies exist, NOT just HTTP 200.
- Follow with `bg_bedrijfsnieuws` accepted source links, freshness, company match and protected suggested actions / consent plus independently proven orders. News can still be zero if no credible article exists; no fabricated green.
- Internal code stays restricted: `anon` and `authenticated` currently lack EXECUTE, `service_role` retains execution. No GRANT changes.

Candidate state only; source freshness/revenue not yet live-proven.
