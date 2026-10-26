# Development ledger — Netlify scheduled social-learning FFmpeg bundling, 2026-10-23

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4445
- Same-lineage change candidate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4805
- Fingerprint: `powerhouse|netlify|scheduled-social-learning-ffmpeg-global-bundle-20261023-v1`
- Observed: Netlify deploy 6adb708cf76ddcef00357a6b packaged 32.5 MB evaluator functions; Netlify Scheduler request 01M5MH21KZKK5ZAQW0NAEWZ18Z returned 499 after 14.986 seconds, with no usable function invocation.
- Source cause to test: globally included FFmpeg executable bloat in unrelated scheduled evaluator functions. Causality for all 499s is **not yet proven**.
- Fix: scope FFmpeg binary inclusion to the original Instagram frame extractor, maintain its exact identity and media proof controls.
- Regressions: tests/brain-netlify-scheduled-learning-binary-scope-v1.test.mjs verifies Netlify config and untouched social/revenue hourly evaluation.
- Owner: existing original P0 #4445. No new cron, generation, provider write or revenue outcome.
- Required validation: Required CI + CodeQL, Netlify preview bundle sizes plus Mira frame executable, protected merge, exact production deploy, real scheduler invocation, canonical qualified learning evaluation and source-backed next decision.
- Metrics: evaluator artifact bytes, provider 499 rate, invocation rate, time-to-first-real-evaluation, cohort coverage, zero duplicate schedules and zero fake promotions.
- State: CANDIDATE_ONLY; production and user-facing evidence still open.

## 23 October deploy admissibility correction

The first Netlify deploy preview for PR #4805 was cancelled as 'no content change', even though the FFmpeg configuration in `netlify.toml` changed. This is a **separate proven fault in the existing deploy applicability classifier**. The same PR explicitly classifies `netlify.toml` as Netlify-runtime-affecting, so its existing `tools/ci/netlify-ignore-build.mjs` no longer skips a config-only function packaging change. The new regression checks this rule. Do not claim a successful deploy until a fresh real preview is READY with the measured function artifact sizes and the original Mira video binary intact.

## Native preview build gate correction

The updated deployment applicability classifier fixed the source-level classification but Netlify still cancelled the latest deploy-preview, because the cached-commit no-change heuristic remained authoritative. The same PR therefore sets `ignore = "exit 1"` **only** under `[context.deploy-preview]` so every preview really bundles and verifies functions. Production continues using the existing selective ignore script. This deliberate preview cost is bounded by existing PR activity (no extra schedule); success requires a READY preview and measured frame extractor and evaluator bundles.
