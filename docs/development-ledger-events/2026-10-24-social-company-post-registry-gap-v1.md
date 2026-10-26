# Provider-proven LinkedIn company publication registry gap — 24 October 2026

- Evidence: LIVE_PROVEN LinkedIn company post URNs on 15–24 Oct reside in `content_publication_obligations`, but `social_posts` has no corresponding provider IDs. `bg-social-metrics-sync` currently registers new Instagram media and measures personal LinkedIn; company analytics permission 403 persists.
- Root cause: no existing provider-proof-to-social-index handoff for live-proven company publications, disconnecting downstream social-learning measurement.
- Fix: extend the **existing** social metric source function and its existing six-hour schedule with bounded idempotent registry-only bridge; use canonical LIVE_PROVEN as input; keep brand tenant separate.
- Verification required: protected CI/CodeQL, real Supabase Edge deploy of exact source, next canonical cron call, new social_posts provider URN readback, then fresh *provider metrics* and matured evaluation separately. No synthetic historical snapshots.
