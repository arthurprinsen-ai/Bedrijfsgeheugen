# 2026-11-01 Janitor 422 / SIGPIPE — guarded terminal lineage

Obligation-ID: github|janitor-terminal-lease|bounded-successor-history|http422-sigpipe|20261101-v1
Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5320
Historical run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41342975119
Artifact: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41342975119/artifacts/13098203266

**Primary observed:** sole `janitor` failure, step `Reconcile stale Actions and merged branch debris`, HTTP 422 followed by a jq Broken pipe. The direct endpoint is not logged and remains a hypothesis. Branch reconciling and archiving passed; readback for this step skipped. 133 sampled supervisor `DRIFT_DETECTED_NOT_PROVEN_RESOLVED` events are not repaired by this patch.

**Most likely chain:** #2225 is closed/unmerged and still marked terminal delivery. #2353 is a merged same-obligation successor (explicitly supersedes #2225), but it was merged 2026-09-19 and falls outside the latest 100 closed PRs. The janitor treats zero matches in this finite set as complete absence and tries an unconditional PR reopen. GitHub 422 (a no-longer-reopenable PR, potentially missing head ref) would cause the shell consumer to exit and the upstream jq process to get SIGPIPE. A later failing branch deletion cannot be fully excluded from the historical log.

**Repair:** a recent-only view can prove presence, not absence; a missing successor is deferred to the existing canonical delivery owner, with structured runtime evidence. It no longer invokes PATCH on guessed absence. Both terminal-lease and branch streams are materialized before `while`, and branch delete failures emit branch/ref context. No new scheduler, no bypass of main protection or release checks.

**Regression:** `node --test tests/brain-janitor-terminal-lease-422-20261101.test.mjs`; replay historical #2225/#2353, bounded negative, file-backed loops, contextual branch failure, no unsafe PATCH. Complete Required/CodeQL gates and provider readback after protected merge before calling fix live.

**Portaal:** mark historical run `PARTIAL_FAILURE`, not global red for all jobs and not green; show artifact uploaded, cleanup readback skipped, 133 drift observations separately unresolved. Candidate is NOT production until exact-head protected merge and new Janitor run prove it.
