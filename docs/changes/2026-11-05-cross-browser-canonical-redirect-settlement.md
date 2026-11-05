# 2026-11-05 — canonical slash does not make recovered document requests permanently red

Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447  
Original failed postmerge browser run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42075945749  
Artifact: 13439631334. Fingerprint: `ci|cross-browser|canonical-trailing-slash-transient-document-reset|20261105-v1`.

## Provider-observed root cause
The original Chromium mobile browser sweep traversed 271/271 public routes; desktop 271/271, 20/20 contract tests, Playwright engines, Firefox/WebKit checks and 24 interactions also executed. The last assurance report nevertheless had 1 failed core document request on `/blog/wat-is-een-bedrijfsgeheugen`: `net::ERR_CONNECTION_RESET`. Independent Netlify edge logs at 17:35:36 UTC returned 499 for the aborted no-slash GET, followed by HTTP 301 and canonical trailing-slash HTML HTTP 200 at 17:35:57 UTC. No 5xx in the measured period. This is not proof of recurring page outage.

The existing `filterSettledCoreFailures` suppressed a transient document request only if the failed pathname matched the **exact** final pathname. The original canonical redirect changes `/blog/slug` to `/blog/slug/`, so a successfully recovered document remained falsely failed.

## Minimal fix, no weakened quality gates
Move the pure settlement guard to `tools/site-shell/core-request-recovery.mjs` and normalize **at most one optional trailing slash** for comparisons of recovered document requests only. Suppress a known transient document reset/abort only if a final HTTP 2xx document was actually loaded at the canonical-equivalent path. Every HTTP 3xx/4xx/5xx or missing final result, another path, script, CSS or nontransient failure remains a hard failure. Existing visible main/H1/text/CLS/overflow/broken-image and real screenshot gates stay unchanged.

Node contract regressions execute actual guard cases for exact and slash-canonical positive recovery plus negative cases. Existing production screenshot workflow, browser set, schedule, canonical Netlify authority and uploader unchanged.

## Protected closure
This change is a candidate until exact-head Required, CodeQL and protected merge succeed. After merge, rerun the **original** full live website cross-browser assurance; independently verify the terminal run, 271 mobile and 271 desktop routes, screenshots, 0 failures and artifact. Do not promote ONE BRAIN from OBSERVED/VALIDATED to PROVEN solely on source or CI success. The unrelated Netlify back-up deploy write-path obligation remains separate.
