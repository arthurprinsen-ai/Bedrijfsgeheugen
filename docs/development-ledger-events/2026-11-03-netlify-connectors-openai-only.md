# 2026-11-03 — Connector model provider OpenAI-only
- Source: original Netlify connectors and safe-test extractor, canonical issue #4198.
- Existing native tenant/secret guards retained; exact source uses OpenAI gpt-5-mini; no Anthropic fallback.
- Netlify OPENAI_API_KEY exists production Functions secret; no secret printed.
- Original test/brain-netlify-connectors-openai-only-20261103.test.mjs and updated extractor readiness tests.
- Protected PR, actual source Netlify READY and independent provider receipts remain PENDING, no global-green claim.
