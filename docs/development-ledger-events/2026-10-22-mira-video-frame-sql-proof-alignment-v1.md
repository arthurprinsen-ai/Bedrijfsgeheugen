# 2026-10-22 — Mira video_frame SQL evidence correctness

Immutable event fingerprint: `mira|sql-proof-video-frame-portrait-dimension-false-rejection|20261022-v1`.

Verified: production read-only SQL found 21 of 46 media proof rows with `provider_status=prepublish_verified` yet `identity_gate_result=FAIL`, exclusively for `media_type=video_frame`. PostgreSQL `public.powerhouse_instagram_visual_proof_valid_v1(jsonb,text)` treats video frames as 1080x1350 images; canonical Edge verifier emits 1080x1920. Trigger `enforce_instagram_media_proof_vision_v1` downgrades PASS to FAIL. A .95 video-frame example returned current function false; strict corrected comparator true, while all 22-Oct .86-.93 examples remain false.

Response: bounded, versioned SQL migration with inline positive/negative assertions, BRAIN source test, deduplicated existing #4439 incident knowledge. Do not rewrite historical proof, reduce protected .94 score, or convert SOURCE_CANDIDATE to LIVE_PROVEN without protected merge and provider readback.

This is a source candidate; release and Instagram provider publication NOT YET PROVEN.
