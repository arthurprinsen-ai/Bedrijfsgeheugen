# Original i18n production 502 — privacy-safe cause classification v2

Date: 2026-11-18. Parent original P0: #4215. Canonical incident: `netlify|production-i18n-translate|http-502|20261022-v1`.

## Independent production baseline
Netlify's original production site reported 13 `/api/i18n-translate` HTTP-502 responses in a 24-hour observation on 2026-11-18. The native log entries at 04:47 UTC were `TRANSLATION_RUNTIME_OR_SHAPE`, `upstream_status=null`. This is a broad category and **does not prove** provider outage, quota, shape, budget, or a missing key.

## Root cause of diagnostic ambiguity (verified in source)
`_brain-ai.mjs` throws upstream errors in the format `OPENAI_PROVIDER_ERROR_<HTTP>:<details>`, while `_i18n-error-evidence.mjs` recognized only a leading bare HTTP code. Every OpenAI 429/500/503 from this adapter was therefore misclassified as a generic runtime/shape failure. The failure handler also collapsed explicit model output-budget, empty text, refusal, invalid JSON and array shape into the same category.

## Bounded correction
In the **existing** diagnostic helper, recognize exact adapter HTTP markers (only 4xx/5xx) and known static failure strings, recording only the existing immutable request correlation, public/confidential class, typed failure_class, and numeric upstream_status. Keep the route's existing fail-closed HTTP 502, 409 sovereignty protection, 503 credential handling, tenant checks, provider selection and privacy policy. No raw exception message, prompt, translated string, email, tenant identity, provider secret or independent dispatch. No new scheduler, function, queue, executor or fallback provider.

Regression tests check actual provider marker parsing, invalid prefixes, 429/500/503, output exhausted, empty/refusal, malformed JSON and mismatch, log redaction and original route 502 semantics.

## Acceptance and remaining work
Protected Required and CodeQL; protected merge; exact main/Netlify revision readback; one **fresh** production failure classified by safe code before root cause can be assigned, and then an actual fix of the proven cause (or exact independent successful translated output readback), regression, owner learning ACK. This PR is **diagnostics only**. 13 historical HTTP 502s do not turn into successful translations automatically. Do not close P0 #4215 or the overall #4198.
