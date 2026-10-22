# Bounded GitHub network recovery for canonical Required Gate Watchdog — 2026-10-22

- Fingerprint: `github|watchdog|bounded-read-retry-and-write-reconciliation|20261022-v1`
- Real source finding: the existing watchdog API wrapper did not specify a request deadline or bounded read retries. It is a control-plane resilience gap, **not** an explanation of ChatGPT's UI streaming interruptions.
- Change: 12-second AbortSignal deadline for each request; maximum two retries after 250ms/750ms only for GET transport errors or statuses 429, 500, 502, 503, 504.
- Critical safety: POST GitHub issue comments and workflow dispatches are **never** automatically replayed on an ambiguous response. The next canonical five-minute tick must read back existing markers/jobs first.
- Reuse: same existing watchdog, same repair owner, same gate thresholds, same queue, same Brain learning register; no new scheduler, provider, repository-wide write agent, or security relaxation.
- Evidence/tests: `tests/brain-required-failed-gate-owner-routing-v1.test.mjs` exercises retries, deadline signal, 403 refusal, maximum attempts, uncertain POST and no duplicate signaling.
- Exact-head Required CI, CodeQL, protected merge and subsequent real watchdog-provider readback are pending. A candidate must not be presented as live.

## 2026-10-22 production-run discovery: unrelated bulk dispatch fanout

Immutable live [watchdog run #39814141663](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39814141663) succeeded, placed two actual existing-PR failed-gate owner signals, but also dispatched **19 missing Required checks** in one five-minute tick, including retired historical PRs. That unexpectedly creates unnecessary runner and workflow queue pressure. Root-cause fingerprint: `delivery|failed-gate|unbounded-watchdog-dispatch-fanout|20261022-v1`.

Same owner/PR regression now limits newly dispatched Required checks to **two per tick** and excludes explicitly RETIRED/SUPERSEDED, RELEASED or terminal-success PRs. It preserves the full existing PR scan and the two independent failed-gate owner signals, and never cancels already healthy queued jobs. Verified release needs new exact-head Required and CodeQL, protected merge, a real post-merge watchdog readback and no repeated unbounded fanout.
