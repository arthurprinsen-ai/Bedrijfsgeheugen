# Canonical improvement ledger — source claims are not independent proof
Date: 2026-10-23
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547

- Observed: current Portal V2 quality report and KPI accepted self-declared PROVEN / VERIFIED booleans and syntactically safe HTTPS URLs as verified customer or knowledge evidence.
- Root cause: no independent provider reconciliation or signed source authority in the read-only runtime.
- Containment: two-tier status: `BRONCLAIM` for submitted URLs, `NIET BEWEZEN` for absent records; do not promote. Preserve counts, dedupe and inspection links.
- Regression: replay false provider authority and forged verifiedOutcome records, as well as existing functional, XSS, temporal and dedupe cases.
- Gate: exact-head Required+CodeQL, protected review/merge, Netlify production SHA readback and authenticated DOM checks.
- Independent business uplift: NOT MEASURED. No vendor/model promotion, second agent/scheduler, database write or new costs.
