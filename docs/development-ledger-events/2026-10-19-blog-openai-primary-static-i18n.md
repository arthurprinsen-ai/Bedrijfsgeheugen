# Development ledger — OpenAI blog translation migration

- Date: 2026-10-19
- Obligation: blog-openai-primary-static-i18n-20261019
- Area: website/static English locale, canonical daily blog publisher
- Root cause: Anthropic account billing was a hard dependency in translation-cache preparation despite OpenAI being available to the workflow
- Intervention: replace Anthropic first-hop translation with only OpenAI Responses; retain exact translation-cache and protected-publish gates
- Existing source reused: `tools/content-growth/openai-approved-blog.mjs` (not forked)
- Regression: `tests/brain-blog-approved-translation-provider-failover-20261019.test.mjs`, `tests/brain-blog-i18n-credit-fail-fast.test.mjs`, `tests/brain-i18n-translation-throttle-resilience-v1.test.mjs`
- GitHub evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39174978217
- Acceptance state: awaiting current-head Required CI, CodeQL, protected merge, Netlify production readback
- Integrity: no invented provider delivery, no bypass of prior quality or permission gates
