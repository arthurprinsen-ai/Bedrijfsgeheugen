# 22 October 2026 — fix three inherited social-learning source oracles

Obligation: `ci-social-learning-canonical-source-oracles-20261022`. Fingerprint: `ci|social-learning|legacy-source-oracles-after-canonical-native-routing|20261022-v1`.

Source: GitHub Actions Buffer Social Learning run [39828093988](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39828093988), exact main 47f302f9be29be967e35d31edd0e76795f46945b; 3 observed failing original tests. The legacy diagnostic Buffer collector is intentionally **not scheduled**. The canonical content supervisor routes media before **channel-specific** publisher lanes, rather than a retired undifferentiated publish-only call. Actual Mira video-frame denial uses `VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH` plus `MIRA_FACE_DRIFT_ACROSS_REEL_FRAMES`; security remains mandatory.

Correction is bounded to three *existing* source-contract tests, a positive/negative new Brain regression, one machine learning record and an append-only development ledger. No SQL, Netlify/Supabase functions, publisher, credential, scheduler or runtime changes. Tests explicitly forbid a second Buffer schedule, verify router-before-Instagram-publication and require negative frame-vision and same-face checks.

Status: CANDIDATE. Required CI, Powerhouse CodeQL and complete independent BRAIN 0-fail are pending at commit creation. No provider publish success, real consumer outcome, production or skill readback is claimed.

## Required admission dependency boundary

[Run 39831651154](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39831651154) proved direct original-suite import in the dependency-free learning gate fails because `@netlify/blobs` is unavailable prior to `npm install`. Correct containment: learning `historical_replay`/`shadow`/`canary` run lightweight independent source/negative-gate assertions; `tests/brain-social-learning-full-suite-replay-20261022.test.mjs` imports **all three original suites** under Required's backend with dependencies installed. Both are required before release. No skip, no weakened proof, no new schedule.
