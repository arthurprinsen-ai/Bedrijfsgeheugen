# Activity ledger — 2026-10-25 — Mira temporal rejection recovery

- Owner: existing canonical #4439 Mira media owner; same original router and Brain.
- Obligation-ID: `mira|temporal-quality-rejection-brain-recovery|20261025-v1`.
- Real incident: authorized production request 12609 returned HTTP 422 for OpenArt alternate `a6sdR46HDe58uRlardNl` on temporal confidence 0.890 below existing minimum 0.900. No Meta post.
- Exact failure: media job failed to retain alternate history; continued showing original 0.920 face failure.
- Change: same-job compare-and-swap diagnostic, bounded quality-only classification, stable Brain occurrence fingerprint, distinct new candidate eligibility, block same known-rejected history.
- Constraints: no skipped prepublish check; no quality threshold drop; no public authority change; no new scheduler, queue, provider creative spend, link/DM, retry of published content, or fake green.
- Regression: `tests/brain-mira-temporal-quality-rejection-recovery-20261025.test.mjs`.
- Acceptance: independent full CI/CodeQL, protected merge, exact Supabase Edge source readback and real next candidate proof. Until then Instagram stays BLOCKED, no provider receipt claimed.
