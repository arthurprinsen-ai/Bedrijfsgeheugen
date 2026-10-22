# Development ledger — Mira literal first-frame sampling

- Date: 2026-10-22
- Existing canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439
- Obligation: `mira|literal-first-frame-extractor-evidence|20261022-v1`
- Root evidence: existing frame extractor labelled +0.25s as start in an 8-second video; source clearly differs from actual first decoded frame t=0.
- Corrective files: `netlify/functions/instagram-video-frames.mjs`, `netlify/functions/_instagram-frame-sampling.mjs`, and `tests/brain-mira-literal-first-frame-sampling-v1.test.mjs`.
- Regression: start exact zero and 5/8 second samples; invalid duration rejected; original Netlify authorization, OpenArt allowlist, ffmpeg extraction and frame base64 evidence unchanged.
- Existing failure preserved: middle identity confidence 0.930 < required 0.940, no Instagram external ID; no media or status mutation.
- Required delivery: exact-head CI/CodeQL, protected merge and Netlify byte/source readback before claiming this source change is live; subsequent independent frame, temporal and Instagram provider proof before marking channel green.
