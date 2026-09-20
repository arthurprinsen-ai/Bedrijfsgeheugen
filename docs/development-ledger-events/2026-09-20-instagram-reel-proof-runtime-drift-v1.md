# 2026-09-20 — Instagram Reel proof/runtime drift recovery

Fingerprint: `instagram-reel-proof-runtime-drift-v1`

## Activity
Recovered the 2026-09-20 Mira Instagram Reel delivery lineage without selecting a second winner or bypassing identity gates.

## Material changes
- Preserve strict frame-level identity fields in the Reel aggregate proof.
- Reconcile the deployed Instagram media verifier with canonical GitHub source.
- Harden orchestrator pending selection from `limit(1).maybeSingle()` to bounded array-first selection.
- Record root cause, prevention, evidence, documentation and skill projection in the same delivery lineage.

## Evidence
- Winner recommendation: `50db782b-926f-4d3b-a2f4-2034b1767f3e`
- Winner score: `instagram-mira-daily-winner-score-v1`
- OpenArt history: `Lhq1tVxofFM14AFBXRVq`
- Final media SHA-256: `ccf287a1ecdc05671f803e8285973e52012b9788599a7ea7d4e592f5a12feff7`
- Router proof: `instagram-router-proof:2026-09-20:ccf287a1ecdc05671f803e8285973e52012b9788599a7ea7d4e592f5a12feff7`
- Proof writeback readback: media job `PROOF_VERIFIED`, obligation `APPROVED`

## Terminal condition
This ledger event is not a LIVE_PROVEN claim. Terminal closure requires protected merge, canonical runtime deployment, generated Instagram artifact, provider dispatch/readback, `social_posts.format=reel`, winner-lineage outcome writeback and learning closure.
