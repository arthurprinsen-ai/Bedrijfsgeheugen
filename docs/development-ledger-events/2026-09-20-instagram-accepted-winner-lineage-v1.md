# 2026-09-20 — Accepted Instagram winner lineage recovery

Fingerprint: `instagram-accepted-winner-downstream-lineage-v1`

Material change: preserve the frozen daily winner across selector → orchestrator lifecycle state. The selector's expected `accepted` status must not invalidate the exact persisted winner downstream.

Evidence: winner `50db782b-926f-4d3b-a2f4-2034b1767f3e`, media job `PROOF_VERIFIED`, orchestrator error `INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED`.

Terminal closure still requires protected merge, canonical Supabase runtime deployment, artifact generation, provider publication/readback, Reel normalization and winner outcome writeback.
