# 2026-10-06 — Notion projection round-trip acceleration v1

Optimized the authenticated company-decision Notion projection after current-state inspection showed row concurrency was already present but per-row lookup remained on the hot path.

Normal existing-row flow changes from query+update per decision to batched prefetch plus direct bounded updates. Missing rows keep query-before-create. Central retry handles provider throttling/service pressure without scattered retry loops.

Hard bounds:
- row concurrency 1..6;
- prefetch batch size 1..50, default 25;
- prefetch concurrency 1..3, default 2;
- retry attempts 0..4, default 2.

Regression authority: brain/adapters/notion-company-writer.test.mjs, brain/adapters/company-decision-notion.test.mjs, tests/brain-notion-off-critical-path-v1.test.mjs.
