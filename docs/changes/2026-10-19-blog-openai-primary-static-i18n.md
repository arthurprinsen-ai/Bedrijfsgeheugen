# Blog translation: OpenAI primary (2026-10-19)

**Obligation:** blog-openai-primary-static-i18n-20261019

The blog publishing workflow already uses the canonical `tools/content-growth/openai-approved-blog.mjs` with source minimization. Its NL→EN static cache generator still preferred Anthropic; repeated runs failed with insufficient Anthropic credits. Source evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39174978217

## Repair

- `tools/site-shell/build-localized-routes.mjs` now calls only OpenAI Responses for uncached translations. `ANTHROPIC_API_KEY` and Anthropic HTTP calls are not used in this lane.
- The existing `OPENAI_API_KEY` is the sole key. Preserve bounded batches, exact JSON output, immutable URL/template token checks, rate-limit backoff and billing fail-fast (including OpenAI 429 insufficient quota).
- The translator persists a scoped cache only after complete verified content, and `STATIC_I18N_NETWORK=0 STATIC_I18N_REQUIRE_CACHE=1` still guards production.
- Reuse the previously merged canonical OpenAI blog generator rather than creating a second generator or approval queue.

## Acceptance / no false green

Required CI/CodeQL, protected merge, rerun canonical blog publication for the business date, and a live Netlify route containing the expected content ID are mandatory. A generated article is not a published article. This candidate must not change or weaken CRM email recipient authorization or social-duplicate checks.
