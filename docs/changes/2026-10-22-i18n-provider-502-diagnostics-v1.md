# Netlify i18n translation 502: privacy-safe failure classification

Date: 2026-10-22
Parent: GitHub P0 #4215
Canonical fingerprint: netlify|production-i18n-translate|http-502|20261022-v1
Owner: existing Netlify translation function (no parallel agent/scheduler).

## Reproduction / evidence

Netlify provider edge request 01M5HQR0S42BBGP87AG7PFMAGD returned POST https://www.bedrijfsgeheugen.nl/api/i18n-translate HTTP 502 at 12:00:34 UTC; a recent deploy-preview-4708 request 01M5JF8SEX3S6DK38Y2D2BEZ9M returned 502 at 18:51:40 UTC. The existing translation wrapper catches every non-sovereignty exception as 'translation_failed' HTTP 502 and loses the useful upstream status or result-shape class. The *actual* upstream error has not been proven; do not attribute it to a missing key or model outage without provider logs.

## Small fix

The route creates a random request correlation id only for AI translation calls and supplies it to the already-authorized governed production AI path. A reusable pure diagnostic helper emits one bounded structured failure log: existing incident lineage, request UUID, data class (not tenant), failure class, and numeric upstream HTTP status extracted only when the provider adapter begins its message with a 4xx or 5xx code. Never serialize exception messages, API keys, prompts, translated text, URL parameters, user or tenant IDs. A failed log transport cannot turn the original HTTP 502 into a 500.

Confidential authorization, sovereignty denial HTTP 409, missing credentials HTTP 503, input guards, existing fail-closed translation HTTP 502, and approved Anthropic routing are unchanged.

## Acceptance

Local Node test file tests/brain-i18n-translation-diagnostics-v1.test.mjs: six tests passed. Protected Required, CodeQL, Netlify deploy parity, exact-main production readback, and actual classified provider failure evidence are mandatory before closing this incident. Diagnostics **do not** establish the HTTP 502 root cause or make translations successful.

No new queue, cron, fallback provider, database, private log storage, or bypass.
