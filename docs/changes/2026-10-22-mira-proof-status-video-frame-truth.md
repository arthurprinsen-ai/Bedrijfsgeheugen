# P0 #4439 — Instagram Mira exact media-proof status truth

Fingerprint: `mira|prepublish-status-fail-contradiction|20261022-v1`.

## Provider-grounded cause

Direct Supabase readback of `public.powerhouse_media_proof_evidence_v1` found 21 of 46 historical records with `provider_status=prepublish_verified` while `identity_gate_result=FAIL`. The existing BEFORE trigger correctly demotes invalid vision evidence to FAIL, but does not demote the preliminary status. The SQL validator additionally handles `video` and `reel` as 1080×1920 yet treats `video_frame` as a 1080×1350 image. An actual 2026-10-19 video-frame record with score **0.95** was rejected: calling the same database validator with `video_frame` returns false, but with `reel` returns true. The media-type misclassification is confirmed, but this specific historic 0.95 record also used the OLD August Mira master (`ab32dfce...` and an August CDN URL), rather than the corrected September master (`e32863f...`). Therefore it is NOT eligible for promotion after correcting the video-frame classifier. The October 22 sub-0.94 issue is independent and also remains blocked.

## Narrow correction

- Reuse existing validator and trigger in place. `video_frame`, `video`, `reel` are explicitly 1080×1920. Still images remain 1080×1350.
- SQL validator now requires the approved Mira master, actual two-image vision lineage, identity-match evidence and **>=0.94** face confidence. No metadata-only bypass, token changes, loosened security or new scheduler.
- When a row's identity verdict is FAIL/absent, its provisional `prepublish_verified` must be `prepublish_rejected`; align nested verified/final flags. A genuine external provider-published result, if already present, must remain historically visible for independent reconciliation, never silently deleted.
- Include predicate smoke tests (synthetic 0.95 video frame with the **correct September master** accepted as a predicate, 0.92 rejected, stale August master and wrong dimensions/hash rejected) and Node source regression. These are **synthetic logic tests**, not proof that any real Instagram video is acceptable. Read-only historical simulation: none of the 46 original records becomes newly valid under all proposed strict guards; the six October 22 rejected assets remain rejected.

## Release and non-goals

Do not directly edit past immutable rows or production before protected Required CI, CodeQL, and Supabase Preview / approved SQL migration pathway. Check current main/preview drift, test exact deployed validator/trigger and run producer→router→post proof. Do not mark Instagram LIVE_PROVEN without the real unique provider media ID and public permalink readback. The 2026-10-22 canonical media job is still WAITING_PROOF; its six rejected exact faces at 0.86–0.93 **remain rejected**, regardless of this fix. PR #4630 unrelated financial parity stays draft and retains its own proof requirements.
