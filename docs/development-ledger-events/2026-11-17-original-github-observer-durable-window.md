# 2026-11-17 — Native Actions-foutobserver verloor voortgangsisolatie tussen vensters

Fingerprint: github|janitor|native-actions-observer-freshness-gap|20261117-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Original owner: existing hourly powerhouse-repository-janitor, not a new scheduler or writer.

Evidence: Native GitHub Actions run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44053428979 failed at 09:13 UTC and had no original Brain occurrence at independent audit. Existing observer had 2,554 original native occurrences with latest timestamp 04:32 UTC. Exact occurrence github-actions:workflow:347590495:run:44053428979:attempt:1:failure was then actually written via original public.brain_observe_failure at 09:40 UTC. Independent readback proved payload-SHA256 295faf8a438e5713725693171949f84f2538048d17a985a8f0874b933b030556, matching source, run, head and original workflow. Separate canonical source-gap occurrence source-audit:20261117:github-native-failure-observer-gap-v1 recorded/readback under the existing one-Brain failure registry; still OBSERVED.

Source-code defect: all twelve 4h windows were scanned before any Brain-write; a late source failure could discard preceding completed windows. This is a validated fragility, not proof of the actual five-hour observer-staleness root cause in the absence of its native failed-job log.

Repair candidate: same original scanner persists each fully verified window with immutable exact-source-id readback before reading the next; nonzero source failure with partial checkpoint and never false complete. Existing tests plus new source-replay regression; existing hourly Janitor owns next natural run. No direct provider actions or risk-gate weakening.

Release remains OPEN until protected Required/CodeQL/merge, exact production main, first and second natural native hourly Janitor readbacks, fresh real known failures and original ONE BRAIN consumer/learning proof.
