# Bounded GitHub network recovery for canonical Required Gate Watchdog — 2026-10-22

- Fingerprint: `github|watchdog|bounded-read-retry-and-write-reconciliation|20261022-v1`
- Real source finding: the existing watchdog API wrapper did not specify a request deadline or bounded read retries. It is a control-plane resilience gap, **not** an explanation of ChatGPT's UI streaming interruptions.
- Change: 12-second AbortSignal deadline for each request; maximum two retries after 250ms/750ms only for GET transport errors or statuses 429, 500, 502, 503, 504.
- Critical safety: POST GitHub issue comments and workflow dispatches are **never** automatically replayed on an ambiguous response. The next canonical five-minute tick must read back existing markers/jobs first.
- Reuse: same existing watchdog, same repair owner, same gate thresholds, same queue, same Brain learning register; no new scheduler, provider, repository-wide write agent, or security relaxation.
- Evidence/tests: `tests/brain-required-failed-gate-owner-routing-v1.test.mjs` exercises retries, deadline signal, 403 refusal, maximum attempts, uncertain POST and no duplicate signaling.
- Exact-head Required CI, CodeQL, protected merge and subsequent real watchdog-provider readback are pending. A candidate must not be presented as live.
