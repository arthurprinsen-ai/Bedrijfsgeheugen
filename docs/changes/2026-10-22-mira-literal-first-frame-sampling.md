# Mira literal first-frame evidence — 22 October 2026

Parent: [P0 #4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439). Obligation: `mira|literal-first-frame-extractor-evidence|20261022-v1`.

## Source-grounded finding
The existing authenticated Netlify `instagram-video-frames` extractor used `min(0.25,max(0.05,duration*0.05))` for its sample labelled `start`. For an 8-second Reel it therefore verified the frame at **0.25s**, not the actual **0.00s first decoded frame**. This made start-frame face-score evidence ambiguous even when the OpenArt model was instructed to use the immutable September Mira photograph as a literal first frame. The independently observed middle-frame confidence **0.930** is still below **0.940** and remains a genuine block. This source fix does not assert a passing video.

## Narrow correction
Export a pure bounded sampler and use `start=0`, `middle=duration/2`, and the same prior end offset. Preserve approved OpenArt CDN allowlist, scheduler-token auth probe, video max 120 MB/60 sec, exact media extraction, JPEG decode, source provenance and strict downstream face/temporal gates. Add Node regression tests for 5/8 second timing and bad duration inputs.

## Gates
No new scheduler, OpenArt generation, Instagram publication, identity threshold change, independent status store, unrelated SQL deployment or automatic merge. Exact-head Required + CodeQL, protected merge, Netlify production artifact readback, then a *separate* genuine re-verification of a fresh rights-cleared video are prerequisites. Proof sampling correction does **not** imply full Powerhouse GREEN.
