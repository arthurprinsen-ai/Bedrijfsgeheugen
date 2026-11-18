# Original i18n 502 — governance-wrapped provider response classification v3

Date 2026-11-18. Same original incident #4215, broader P0 #4198. Same Netlify production `/api/i18n-translate` and its existing `_brain-ai.mjs`, `platform/brain/production-ai.mjs` and original error evidence logger.

## Production observation
After protected diagnostic PR #5991 merged, latest Netlify production main was READY, yet Netlify native request observability still found 14 HTTP502 responses for `/api/i18n-translate` between 06:55 UTC and approximately 07:09 UTC, with `TRANSLATION_RUNTIME_OR_SHAPE` and `upstream_status=null` in native logs. This is proof that diagnostic v2 did not classify these failures, **not** proof that the actual upstream provider was down.

## Source-confirmed diagnostic mismatch
`_brain-ai.mjs` throws `OPENAI_PROVIDER_ERROR_<HTTP>:<details>` for a model request rejected by the provider. But `runGovernedProductionAI` in `platform/brain/production-ai.mjs` wraps exceptions as `AI provider failed safely: <original error>`. The v2 helper only matched codes anchored to the unwrapped `OPENAI_PROVIDER_ERROR_` marker, thus still returning generic 502 when an ordinary wrapped provider code was encountered. Wrapped output-budget, empty response and refusal markers were similarly hidden.

## Bounded fix
In the **existing pure error helper only**, recognize exactly the known static governance prefix and then parse the known adapter marker and known static output codes. Never log or serialize provider messages, prompt, request content, tokens, tenant ID or exception stack. Preserve original 409 sovereignty gate, original 502 fail-closed response, unchanged model/credentials/governance/token metering, and existing one incident fingerprint. Regression uses exact source contract + wrapped/unwrapped 400/401/429/500/502/503, redaction and unknown-error negative cases. No parallel translation endpoint, provider fallback, model switch, new queue or bypass.

## Acceptance / nonterminal
Protected Required + CodeQL + merge + Netlify production exact commit readback. Independent new postrelease typed incident or successful translated response is required to establish actual upstream reason/functional repair; older 14 HTTP502 events are historical observations. Remain NOT GREEN until provider issue itself is fixed and exact bilingual UI readback is successful, then ONE BRAIN/Heartbeat outcome ACK. Original #4215/#4198 remain OPEN.
