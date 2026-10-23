# Instagram frozen-source winner: truth-preserving guard (2026-10-23)

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439

Production source contract conflict: same-day winner `7880c326-72b8-4ac8-a712-971a9a24de12` is externally source-backed (privacy complaint), while the unchanged date-modulo library selector proposes unrelated `PH-P030` (takeover integration). Its evidence explicitly forbids forcing that external privacy complaint into a business/portal case. The already completed OpenArt 8-second video `S2WRHcZAKIV5Cxn2tZLE` is not identity-verified or published.

This branch reuses the **existing** Instagram media-router. It reads the daily winner and actual Mira problem lineage plus exact recommendation, then checks source URL/hash, reservation, and any *explicitly approved* problem/scene mapping before accepting manifest media. Date modulo is now pre-freeze only. An external source that expressly prohibits the library/business bridge yields `SOURCE_BACKED_MIRA_SCENE_ROUTE_REQUIRED` instead of silently swapping story or fabricating a PH-P case.

This is a guarded partial fix, **not** the full release: the legitimate source-led creative/caption route must be designed and validated in the same original owner lineage. Today there is no approved source scene, no proven 0.940 start/middle/end face, no verified temporal proof, and no Instagram receipt. The guard intentionally returns `WAITING_WINNER_MAPPING` on preflight without writing another scheduler/queue/incident or consuming provider credits. No provider-create, direct SQL status update, lowered identity threshold, duplicate sender, source/winner rewrite or cross-date recycling.

Verification: `node --test tests/brain-mira-frozen-winner-source-lineage-20261023.test.mjs`, exact-head Required and CodeQL, protected merge, Supabase postdeploy source readback. Following work: source-led approved caption and scene parity across orchestrator/publisher, semantic media approval, exact existing video identity/temporal proof and independently verified publication.
