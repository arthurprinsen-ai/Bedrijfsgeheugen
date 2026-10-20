# Development ledger — Mira element2video canonical master mode

- Date: 2026-10-09; parent incident P0 #4198; existing publisher/media router only.
- Root cause directly inspected: `validMiraGenerationReference` rejected OpenArt identity-reference element2video, although that is the correct mode for a NEW business scene.
- Separate media-provider error: OpenArt Gemini Omni 1.1 Flash history `n7ynDEY78rcusspUWLwU` FAILED, `upstream_error`, Google 1002. No image/video output or live Instagram proof.
- Code repair: shared reference guard permits only exact master-referenced image2video/element2video with generation history, router advertises allowed modes; no arbitrary provider/source mode.
- Regression: `tests/brain-mira-generation-reference-v1.test.mjs` verifies approved modes, mismatched master rejection, no unconfirmed history, disallowed text2video, min 0.94 face score and all three video frames.
- No relaxation of real Anthropic vision/temporal checks, no direct publishing, duplicate posts, extra executor, Make or Buffer.
- Acceptance: protected CI/CodeQL, exact source-parity Supabase deployment, a real media generation and identity-proof result, one provider-confirmed Instagram publication, sales outcome and Brain learning before any whole-loop green claim.
