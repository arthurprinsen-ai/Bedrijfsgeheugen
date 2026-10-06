# 2026-10-06 — Control-plane lane ownership

- Obligation: `control-plane-lane-ownership-20261006-v1`.
- Evidence source: PR #3941 Required run `37473752255`.
- Observed changed runtime-relevant source: `scripts/brain/test-chat-learning-preflight-compiler.mjs`.
- Incorrect classification: automation + backend + portal + website.
- Escaped cost: full website build/browser crawl for non-website control-plane work.
- Repair: remove `scripts/brain/` from shared executable prefixes; preserve backend lane ownership and exact scoped overrides.
- Regression: generic brain script => backend only; explicit autonomous-engineering brain script => automation only.
