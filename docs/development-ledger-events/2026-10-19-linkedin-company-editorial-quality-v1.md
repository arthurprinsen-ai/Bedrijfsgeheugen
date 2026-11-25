# 2026-10-19 — Bedrijfsgeheugen LinkedIn company editorial correction

## Observations
Supabase publication artifacts on 2026-10-13, 2026-10-15 and 2026-10-18 all rewrote the same TKI Bouw en Techniek subsidy announcement with different recommendation IDs. The 2026-10-19 company post was 2,833 characters, opened as a memo to the MT and contained unnecessary technical terms. Every publication was externally marked LIVE_PROVEN.

## Failure class and root cause
EDITORIAL_QUALITY. The generator optimised source signal reporting with a technical, prescribed steering-loop formula; the independent pre-publish review enforced identity and generic rules but no company-specific editorial fitness, while auto-final-approval did not represent independent content quality. Global duplicate checks did not detect a repackaged external news event across distinct recommendations.

## Change lineage
PR #4507 introduces a shared editorial contract under supabase/functions/_shared, binds it to OpenAI generation + bounded rewrite, independent review and the outbound provider boundary, and compares published posts across the last 21 days. Regressions enforce no internal memo, no same named event and acceptance of unrelated owner problems.

## Evidence and acceptance
- Canonical learning: brain/learning/2026-10-19-linkedin-company-editorial-quality-v1.json
- Tests: tests/brain-linkedin-company-editorial-contract-v1.test.mjs and tests/brain-linkedin-company-historical-dedupe-v1.test.mjs
- CI: bestaande Required CI en de Brain-leercanonicalisatie controleert de regressietests zonder nieuwe PR-workflow
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4507
- No claim of Supabase production deployment, next-day publication success or rewriting old public posts without after-merge provider evidence.

## Ownership and prevention
Maintain existing Powerhouse scheduler; never create a competing daily publisher. Reject, revise once if grounded, or block one company post without disabling unrelated channels. Preserve exact post and provider readback truth.
