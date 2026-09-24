# 2026-09-24 — static i18n provider resilience

Run scope: public website English production build.

Evidence before mutation:
- main included the fail-closed i18n contract;
- the successful Netlify production deploy still pointed to an older main SHA;
- Netlify environment metadata confirmed a non-empty secret `ANTHROPIC_API_KEY` for production builds;
- no secret value was copied into the repository.

Action:
- serialize static translation by default;
- add Retry-After-aware exponential backoff for transient provider responses;
- pace batches;
- refresh the exact production browser proof workflow;
- persist learning fingerprint `i18n-translation-throttle-resilience-20260924-v1`.

Closure requires protected CI, protected merge, exact Netlify production SHA and successful live pricing + English-switch browser proof.
