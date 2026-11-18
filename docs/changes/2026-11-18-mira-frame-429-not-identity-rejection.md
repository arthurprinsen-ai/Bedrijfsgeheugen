# Instagram Mira: provider 429 is not an identity rejection

Date: 2026-11-18. Parent original incident: #5232, same closed-loop P0 #4198. Preserve existing source, original router, media job, provider history and external publication gates.

## Independent production observations
Original frozen 18-Nov winner `ab10709a-bad8-4ad4-9305-1b7c0cc83c44` was matched to the canonical OpenArt media job `4a68dc41-6e60-4b64-ba7b-400086cb7296`. Exactly one OpenArt request `r6sZX8kdGyvpD6zEbWg7` generated a complete 1080x1920, 8s MP4, stored via the original job's completion RPC into `VERIFYING`. This is NOT a facial identity approval.

Original `powerhouse-instagram-media-router` `submit_asset` request ID `34812` responded HTTP 422 with `VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH` at position start. The nested ORIGINAL independent verifier response was `ok:false`, `VISION_PROVIDER_REQUEST_FAILED:429`. Thus there was **no face comparison**: the router mistakenly interpreted provider 429 as measured face failure. The original job remained VERIFYING, exact external Instagram ID null, content obligation blocked. A fresh paid OpenArt generation is NOT appropriate.

## Source-level correction
The same original router now calls one pure verdict gate before `recordMediaProofRejection`. A transport/provider failure (HTTP not 200 or `ok:false`) returns `MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE` 503 without falsely rejecting an OpenArt history. Missing measured face evidence returns `MIRA_FRAME_IDENTITY_VERDICT_UNAVAILABLE` 503. A genuine numeric, canonical face comparison below the unchanged 0.940 limit can still be rejected through the existing independent rejection writer. A different measured creative-quality failure is distinct and cannot fake face failure.

Source rule: **no actual measured face result -> no identity failure, no republish, no duplicate generation, no green**. No new scheduler, worker, table, Meta sender, model, credential, or quality threshold.

## Next original owner action
Protected CI Required + CodeQL, merge, exact production parity, retry on the original `r6sZX8kdGyvpD6zEbWg7` after independently established provider access and only within the existing bounded runtime. Require three real 0.940 face scores, temporal proof, immutable media SHA, Meta ID/readback, Brain ACK, Heartbeat measurement and applied learning. Fail closed until each condition has proof. Do not close original #5232 or #4198 from code alone.
