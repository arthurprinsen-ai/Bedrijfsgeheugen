# Development ledger — canonical blog approved translation provider failover

Obligation-ID: blog-translation-approval-provider-failover-20261019  
Incident workflow: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39208299296

**Observed** (UTC 2026-10-19): Canonical daily blog workflow reads a real blog content artifact and attempts `STATIC_I18N_NETWORK=1` translation cache preparation. Anthropic returned `HTTP400 invalid_request_error: credit balance is too low`; `NETLIFY_BUILD_PHASE_FAILED:localized-routes:1` prevented branch publication. 17 and 18 October blog obligations were already `FAILED` with `SILENT_PUBLICATION_FAILURE`; 19 October blog is `GENERATED`, not live.

**Fix candidate**: Add strictly bounded OpenAI fallback transport using the existing repository GitHub secret in the two original protected workflow steps. Anthropic quota/auth errors alone grant failover (or no primary key). Validate strict batch length, string type, URL and placeholder preservation, and production cache completeness. Keep provider-independent production build, the canonical PR and Netlify readback gates.

**Test**: `tests/brain-blog-approved-translation-provider-failover-20261019.test.mjs`. Run alongside original provider-credit-fail-fast and locale fail-closed regression suites.

**Current state**: candidate changes only. No claim of provider secret availability, PR admission, merge, translated cache creation, Netlify deployment or public blog proof until verified. No emails or LinkedIn mutations are made in this change.
