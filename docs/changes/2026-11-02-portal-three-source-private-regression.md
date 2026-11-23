# Original Portal BRAIN 3-source privacy regression recovery — 2 November 2026

## Original failure and verified root cause
Original protected merged PR #5298 / main `9db4f32c4a25b05e9ce3bf3cca7ab64102dd66ca`, exact original full BRAIN https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41451145109 FAILED one out of 5,000+ tests in original job 125296963109: `tests/brain-predictive-portal-runtime-truth-20261030.test.mjs`, "server-to-server coverage keeps private incident evidence out of portal", assertion `3 !== 2`.

The source authority `brain/observability/failure-coverage-projection.mjs` now reads three genuinely different server-side authorized datasets: (1) aggregate failures (count exact), (2) exact predictive incident fingerprint, (3) allowlisted three website incident fingerprints (checkout, SEO date, GitHub PR handoff). The old privacy test stub and call-count expected only two. This was a test fixture defect. Do not delete the newer website readback to satisfy the obsolete test. The failed BRAIN remains a real historical failure.

## Exact original test repair
Retain original production source untouched. Extend test `fakeFetch` with a 3rd `fingerprint=in.` request and exactly three allowlisted rows, whose evidence includes a `DO_NOT_LEAK` canary. Assert all 3 reads, predictive technical status, website `READBACK_COMPLETE`, and checkout/SEO still pending plus PR creation `OPEN_AUTHORIZATION`. Confirm no private canary survives the browser-facing projection. The unchanged server reduces source evidence to bounded non-personal status codes, no raw tenant/user/incident identifiers. This is not authorization to add new public API routes or skip provider errors.

## Persistent learning and acceptance
ONE BRAIN fingerprint `powerhouse|portal|brain-failure-coverage-third-server-readback-test-drift|20261102-v1` observed on original fail. Update original SEO Orders/Portal failure-coverage owner skill; machine rule requires historical replay + shadow + canary on the same privacy regression, an append-only ledger, protected Required/CodeQL and full original BRAIN. Regenerate no System Map unless the exact integrated portal source actually changes. Original #5245 portaal UI publication truth remains unmerged with exclusive owner lease; no false live status. Business/SEO and actual portal admin readback remain separate EVIDENCE_DUE.
