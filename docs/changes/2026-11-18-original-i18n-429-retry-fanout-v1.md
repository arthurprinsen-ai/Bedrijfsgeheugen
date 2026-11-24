# Existing i18n browser runtime — bound true provider-429 request fan-out

Date: 2026-11-18. Root P0 #4215; broader original closed-loop #4198.
Fingerprint: `netlify|production-i18n-translate|browser-recursive-429-burst|20261118-v1`.
Original owners: public static /en build, `assets/js/i18n.js`, original `/api/i18n-translate`, existing Netlify Git release.

## Independently witnessed production failure
- Existing diagnostic fix protected merged by PR #6000 and subsequently published on the production Netlify commit `2408a130dd04c8d01398d54e11ff97558d25c477`, deploy `6afd583c726cf176ada08779` at 07:49:55Z.
- New native Netlify observability on the same `POST https://www.bedrijfsgeheugen.nl/api/i18n-translate` route counted 515 HTTP502 and 412 HTTP499 outcomes in the inspected postrelease window.
- Recent native request logs classified real `UPSTREAM_HTTP_REJECTION`, `upstream_status=429` through the EXISTING safe error taxonomy; no raw prompts, customer text or credentials needed.
- The original browser `assets/js/i18n.js` retry helper did TWO network calls per failed batch, then recursively called itself in groups of five, then retried EVERY unresolved string one-by-one. A repeated MutationObserver also invoked the paid dynamic translator on English public pages that were already statically translated. This magnifies provider credit/quota errors into a burst, wastes API capacity, and keeps the UI in an error loop.

## Scope and bound
Change exactly the existing client translator. On first provider 429/402/5xx or network rejection, stop remaining batches, five-item recursion and per-string replays. Preserve original text; throw the existing visible quality failure. Hold a per-browser-tab five-minute cooldown before another ordinary attempt, NOT a background job. Normal 200 with valid translations still updates the cache. A 200 containing empty translations is a quality error, never permission to send unlimited retries.
For public `/en` routes already marked statically translated, continue normal link/locale controls but do not retranslate newly inserted DOM content over the network; all public EN must still be delivered by the original approved static build. Portal-specific runtime translation remains explicitly authorized and may be retried after cooldown. Bump the original client asset cache identity to `cms-i18n-20261118-1`; preserve tenant/data sovereignty and provider-only OpenAI policy.

## Acceptance
`tests/brain-i18n-provider-storm-bounds-20261118.test.mjs` executes the actual extracted client `translate()`: 43 uncached strings plus a 502 must use **one** fetch only, a second call inside cooldown zero, 429/503/network one request, 200 real approved translation passes, incomplete successful response fails without replays. Test static English MutationObserver guard, existing locale/version checks. Protected Required/CodeQL and correct Netlify production commit needed; then monitor **new** genuine status code volumes on same URL and actual static EN output/portal localized content, and record measured outcome in ONE BRAIN/Heartbeat.

## Explicit noncompletion
This client repair **does not** supply missing OpenAI billing credits, cannot prove that a shared GitHub translation key uses the same account, does not bypass blog English prepublication gates, and cannot make Instagram identity 0.940 or personal LinkedIn source verification true. If further 429 persist, original billing account owner must handle authorization; the browser remains safe and canonical publishers stay enabled. Never claim full closed loop green from a PR, READY website, mock test, or a lone reduced error count.
