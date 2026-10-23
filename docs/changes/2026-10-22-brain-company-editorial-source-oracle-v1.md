# 2026-10-22 — company editorial source-oracle regression fix

**Obligation:** `ci-brain-company-editorial-source-oracle-20261022-v1` · **Fingerprint:** `ci|brain|company-editorial-retired-literal-oracle|20261022-v1` · Existing P0 [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742) / [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Observed failure
Independent verification-only [BRAIN #39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071), head `8e665a86d2bb54712a34fd88bec0e1213df21dd2`: 3,526 tests; 3,171 passed; 355 failed. One failure in `tests/brain-commercial-daily-steering-positioning-v1.test.mjs` matches a literal instruction already replaced by the current company LinkedIn prompt. This is **source-oracle drift**, not evidence that the prepublication editorial guard failed.

## Source readback / correction
Actual `supabase/functions/powerhouse-content-orchestrator/index.ts` includes a specific entrepreneur problem, consequence, next action, actual evidence restriction and a company-specific human writing contract. The generator calls `companyEditorialViolations(bodyText,{recentPosts:recentCompanyPosts})`, boundedly revises rejected company content, and throws `COMPANY_EDITORIAL_CONTRACT_FAILED` if rejection persists. Canonical `supabase/functions/_shared/company-linkedin-editorial-contract.mjs` still denies technical reports, invalid length, missing entrepreneur problems and repeated story families.

Only the inherited one-line outdated prompt assertion is replaced by **stronger positive prompt and negative executable gate checks** in the original test. The original brand story, Mira content, outreach proof/source truth and no-guarantees tests remain intact.

## Release boundaries
No production runtime, publishing, provider calls, SQL, RLS, Supabase project, Netlify or scheduler modified. This is one candidate test-and-learning remediation, not an aggregated 355-failure fix. Run exact-head historical/shadow/canary, Required CI and CodeQL; independently prove full consolidated Unified BRAIN **zero failed**, Supabase clean-room migration parity #3742 and real authenticated tenant acceptance #4215 before protected promotion. Do not merge solely based on this targeted success.
