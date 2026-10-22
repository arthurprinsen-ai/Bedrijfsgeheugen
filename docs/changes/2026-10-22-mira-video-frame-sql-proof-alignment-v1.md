# Mira video_frame SQL proof false rejection — 22 October 2026

- Canonical parent: [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439)
- Fingerprint: `mira|sql-proof-video-frame-portrait-dimension-false-rejection|20261022-v1`.
- Scope: ONLY SQL proof validity function; independent of protected source PR #4634 and separate from existing draft SQL perf PR #4630.
- Observed live production: 21 persisted provider `prepublish_verified` rows have `identity_gate_result=FAIL`; all 21 are `media_type=video_frame`. Existing SQL function checks video/reel as 1080x1920 but treats `video_frame` as still image 1080x1350. The existing BEFORE INSERT/UPDATE trigger silently downgrades otherwise verified video-frame results to FAIL. Concrete historical 2026-10-19 frame had `face_identity_confidence=.95` and `visual.verified=true`, but SQL false and stored FAIL.
- Fix: recognize `video_frame` as 1080x1920 and require `face_identity_match=true`, confidence >=.94, pinned master ID, valid master SHA syntax, two-image vision provenance, existing vision receipt and original semantic checks. Preserve image 1080x1350 and reel/video 1080x1920 requirements, RLS/grants, trigger and all existing rows.
- Built-in SQL transactional positive and negatives: .95 accepted; .93 denied; face mismatch denied; 1350 video-frame denied; absent vision evidence denied; alternate canonical master denied; still image and reel behavior retained. Static BRAIN regression enforces source/SQL contracts.
- **No false green:** 22-Oct OpenArt candidates independently scored .86–.93, below unchanged 0.94 requirement; this correction alone cannot publish them. Do not alter historical proof statuses or Instagram obligation, and never bypass video start/middle/end temporal proof, media hash, provider ID and live permalink.
- Release: Required CI + CodeQL, Supabase preview/SQL execution, protected merge, exact production function source readback, independent provider evidence before declaring Instagram live. Current candidate is NOT production.
- No new scheduler, paid development branch, ad-hoc database write, or duplicate media send.
