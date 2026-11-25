# 2026-10-23 — CI recurrent job family evidence under #4661

Fingerprint: `delivery|predictive-lane-capacity|recurring-executed-ci-hotspots|20261023-v1`; parent [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661).

Existing Janitor #39926363163 ran successfully on source SHA 8a08a22107b29adc4a4fdcd92eb228e5a04790e6: 28 actually executed provider jobs, 13 distinct runs, 0 API errors, sampled wait p50/p95 3s and 3s, max executed job 353s. This does not identify a repeated root cause. Independent exact GitHub workflow/job REST reads found repeated JS/TS CodeQL execution 105/125/140/149/199s, and separate Required preflights ~75–87s. Admission, queue and provider-skip placeholders do not explain those values. Another owner has diagnosed ~47.47s static i18n cache generation inside one real 75s preflight; it is **not** yet a longitudinal speedup or proven critical path.

New scoped code on same #4661 lineage: observed recurring job group requires one numeric workflow ID, exact job name, >=3 independent attempts, matrix duplication suppression, 20/5 global evidence threshold, and fail-closed provider reads; advisory cross-agent lane identification only. Brain learning replay/shadow/canary and immutable tests; no competing build owner, production mutation, new scheduler or queue.

Terminal evidence: exact-head Required/CodeQL green, protected GitHub merge/current-main readback, hourly Janitor on new merged SHA, Brain projection. Hold broader #4661 and provider #4655 open.
