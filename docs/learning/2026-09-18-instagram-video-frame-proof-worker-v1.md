# Instagram exact video frame proof worker v1

Date: 2026-09-18
Fingerprint: instagram-video-frame-proof-worker-v1
Obligation: instagram-external-worker-boundary-recovery-v1

## Incident
A completed OpenArt reel could be materialized into the canonical Instagram media job while remaining in WAITING_PROOF indefinitely. The router required start/middle/end frame evidence, but no worker existed to extract those frames from the exact MP4.

## Root cause
Generation completion and proof materialization were separate responsibilities with no executable bridge for video. The system therefore had a valid exact asset and a valid proof contract, but no autonomous path between them.

## Fix
- Add a bounded Netlify frame extractor using ffmpeg-static.
- Accept only HTTPS MP4 media from cdn.openart.ai.
- Reuse the existing Powerhouse token boundary by probing the canonical Supabase verifier before expensive work.
- Extract start/middle/end JPEG frames from the exact MP4.
- Keep frame bytes transient; do not persist base64 in the canonical job.
- Extend the existing Supabase verifier to accept transient base64 image input.
- Have the existing router invoke extraction automatically when a reel has no supplied frames.
- Preserve the existing strict Mira vision gate and exact MP4 digest binding.

## Prevention
A materialized video asset is not allowed to remain WAITING_PROOF solely because frame evidence was not pre-supplied. The media router owns bounded automatic frame extraction and vision verification. Extraction failure remains fail-closed and must never be converted into metadata-only identity proof.

## Definition of done
Exact-head tests and protected merge, production deployment of the Netlify extractor plus Supabase router/verifier, runtime readback on the canonical Instagram job, and learning/skill propagation.
