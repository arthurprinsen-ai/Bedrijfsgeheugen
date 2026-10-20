# 2026-10-20 — canonical social duplicate-blocked obligation diverged from daily hold
- Evidence: DB obligation linkedin_personal blocked, STORY_FAMILY_DUPLICATE against 2026-10-15; decision blocked/hold with no delivery_ref/error; developer asserted repeated daily generation must not reuse story family.
- Publisher uniqueness gate is correct. Missing path: orchestration reconciliation only looked at decision state, not publication obligation. Preserve anti-double-post proof gate.
- Company actual post externally corroborated using provider-independent LinkedIn post detail at 06:04 UTC for 20 October, user-facing id activity-7518190374964834304; DON'T repost.
- Instagram missing exact verified approved Mira media; no external side-effect. Gmail canonical selected=0/sent=0 with 0 approved.
- Fix candidate: no new scheduler; reconcile obligation + decision only in safe preprovider blocked case; suppress previously rejected source ids; run existing tests + CodeQL + preview + exact deployed source.

- PR #4531 metadata corrected to canonical Delivery-Lane backend after first hygiene admission; candidate remains identical, checks rerun on this commit.
