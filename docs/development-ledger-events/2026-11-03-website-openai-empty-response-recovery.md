# 2026-11-03 — Original website public AI API 502 source lineage
- Original safe public canary pg_net id 19999: POST /api/vraag returned HTTP502 and Netlify safe response header OPENAI_EMPTY_RESPONSE (after diagnostic deploy).
- Source: original governed shared OpenAI helper, GPT5-mini maxTokens:600 for website, 500 portal; token-budget exhaust mechanism plausible, not independently proven as actual finish_reason.
- Protected source proposal: low reasoning and 2200 completion budget, classify exhausted length result as distinct RED; safeguard secrets and original source-only governance.
- Owner: original website-brain-provider-agent; next proof: exact merged SHA Netlify production, real public HTTP200 with answer and sources, no parallel agent.
