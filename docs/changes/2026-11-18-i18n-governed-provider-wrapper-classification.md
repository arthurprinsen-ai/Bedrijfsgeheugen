# I18n provider-status diagnosis after governed AI wrapper

Date: 2026-11-18. Continue ORIGINAL Netlify translation incident #4215, closed-loop parent #4198. Original one-loop website/portal owner only.

## Independent production evidence
Protected PR #5991 made the bounded translation classifier live via Netlify production deploy `6afd4b4ef39e5fbbc0ab1a0d` (READY, exact main `43c78e804f35c624a918029a90b354b851c92843`). An independent public-word production probe `net._http_response 34858` POST to `https://www.bedrijfsgeheugen.nl/api/i18n-translate` returned HTTP 502 at 06:58:48Z. Netlify native request `01M7PQ6WB0N4RH2JKAF59X6A46` logged `i18n_translation_failure`, `failure_class=TRANSLATION_RUNTIME_OR_SHAPE`, `upstream_status=null` after this deployment. Many subsequent 502 attempts in 07:01–07:02Z share the generic taxonomy; true provider cause not yet proven.

## Verified source-level diagnostic gap
The original `netlify/functions/_brain-ai.mjs` invokes original `platform/brain/production-ai.mjs`, which catches an `openai()` thrown `OPENAI_PROVIDER_ERROR_<HTTP>:<untrusted details>` and rethrows prefixed `AI provider failed safely: <message>`. Original PR #5991 classifier only recognized exact **leading** `OPENAI_PROVIDER_ERROR_<HTTP>` and known static output-budget markers, so every provider error passing through this governed wrapper was misclassified as `TRANSLATION_RUNTIME_OR_SHAPE`. The generic outcome is not proof that the underlying error was actually an OpenAI rejection; do not infer 429 or any other status until live readback.

## Bounded correction
ONLY existing `_i18n-error-evidence.mjs`: strip one exact literal governed wrapper in memory, classify *only* whitelisted fixed OpenAI HTTP 4xx/5xx markers, known static model budget/empty/refusal errors, and existing legacy safe codes; never log the original string or any free-text details. Retain original route fail-closed HTTP502, public/tenant separation, governance rules, Netlify credential controls, source translations and security. Regression tests run with simulated guarded provider 429/500/503 and fake customer text, asserting numeric code and zero secret leak.

## Remaining required original production acceptance
Protected Required+CodeQL, exact main Netlify ready SHA, fresh **real public-word** 502 request, native failure_class and upstream_status source readback, then a root-cause-specific fix if required. A corrected diagnostic is not an actual successful translation. No new parallel executor/worker/model/provider, quota bypass, fallback to unapproved API or false-green. Keep #4215/#4198 open until independent successful destination and learning receipts.
