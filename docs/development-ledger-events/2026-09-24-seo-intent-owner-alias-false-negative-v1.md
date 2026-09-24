# SEO intent-owner alias false-negative — 2026-09-24

- Obligation: `seo-opportunity:exact-owner-alias:v1`.
- Production canary found `exact online api` with first-mover score 75.61 and incorrectly classified it as `CREATE_INTENT_GAP_CONTENT`.
- Correct canonical owner: `/exact-online-koppeling`.
- Containment: the generated recommendation was changed from `suggested` to `skipped` before publication.
- Fix: add `exact online api` as a canonical secondary keyword, regenerate runtime intent-owner projection and add a regression assertion.
- Prevention: do not lower the global semantic owner threshold for single aliases; repair canonical maps explicitly.
- Terminal proof requires protected merge, Edge Function v2 deployment and resolver readback showing this query as `UPDATE_MONEY_PAGE` with zero publishable duplicate recommendation.
