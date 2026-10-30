# Development ledger — 29 oktober 2026: full Portal readback on immutable published ancestor

Obstacle: actual published Portal SHA is older than current GitHub main solely due to governance and three independently classified Supabase backend-only source changes. Original manual workflow allowlist had no classification branch and refused safe production E2E even though canonical Netlify runtime was unchanged.

Changed the existing `.github/workflows/portal-v2-production-dom-readback.yml` only at the override-scope step. New bounded CLI `tools/ci/portal-backend-only-production-sha-override.mjs` compares `git diff -z` file list against evidence allowlist or independently backend-only Supabase source with canonical `deriveNetlifyDeploymentApplicability` denying any Netlify/Portal/website/browser impact. Preserve validated main workflow dispatch, ancestor guard, exact immutable/public release identity, browser and visual checks.

Evidence: 11/11 tests pass and source diff from immutable portal `481c2903` to current protected main `a7d28c30`: 24 files including only three typed backend sources. Learning historical/shadow/canary CI contract tests required; real external provider/browser canary still pending. No direct production source writes or forced deploy.
