# CI/CD semantic evidence projection — source-only, one existing Janitor

Canonical parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Fingerprint: `delivery|ci|unstandardized-job-evidence-correlation|20261023-v1`

The existing hourly `tools/delivery/ci-throughput-telemetry.mjs` already samples real GitHub Actions completed jobs (at most 24 run reads, stopping early on independently sufficient evidence). This candidate adds a bounded, OpenTelemetry CI/CD semantic-convention-compatible **local JSON projection** in the same evidence artifact. It is not an exporter, trace collector, span service, critical-path verdict, benchmark, CI dispatch, release authorization or additional scheduler.

Job proof includes exact immutable commit, run ID, attempt, task ID, actual start/end timestamp, task result and GitHub task URL. The outcome is `SOURCE_ONLY_FIELD_COMPATIBLE` only when the existing source sample and independent minimum (20 valid jobs over at least five distinct run attempts) are met. Partial provider reads, malformed SHA, duplicate rows, tainted names, skipped placeholders and missing timestamps never produce a green projection. The original p50/p95 and advisory owner routing are unchanged. No customer-level data is copied.

**Future outcome measurement** must compare baseline with post-change executed jobs, matched by workflow/lane/run attempt, and prove first-time-right, reliability, execution latency and customer goal readbacks independently. Avoid falsely equating shorter CI tasks with causal revenue improvement. A GitHub merge queue would additionally require confirming all protected Required workflows support `merge_group`; it is not enabled by this change.

Test: `node --test tests/brain-ci-cicd-semconv-evidence-v1.test.mjs tests/brain-observed-ci-throughput-v1.test.mjs tests/brain-ci-agent-prioritization-v1.test.mjs`.

Release: exact-head Required + CodeQL → protected merge → read existing hourly artifact under `.artifacts/powerhouse-ci-throughput.json` → verify no new scheduled workflow and no duplicate writer. No claims of live production before proof.

References:
- https://opentelemetry.io/docs/specs/semconv/cicd/cicd-spans/
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
