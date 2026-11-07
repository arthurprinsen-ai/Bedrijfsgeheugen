# Mira: model with recorded face-gate failures blocked before spend — development ledger

- 2026-11-07, owner: original Mira producer and instagram media router.
- Fingerprint: `mira|reel|paid-generation-of-model-with-recorded-face-gate-failures|20261107-v1`.
- Source: Veo 3.1 element2video Reel (history B5uX1JhoC8hl0kiFTrnl, 280 credits) failed the face gate at 0.900 (needs 0.940); same model scored 0.900 on 2026-11-03.
- Repair: generation_preflight now refuses models whose best recorded face score is below the gate (MIRA_MODEL_FACE_GATE_FAILED_BEFORE). No bypass parameter.
- Known limit: the evidence list is maintained in source; a model is only re-enabled by a reviewed change with new measured evidence.
- Status: CODE_CANDIDATE until merged and deployed from protected main.
