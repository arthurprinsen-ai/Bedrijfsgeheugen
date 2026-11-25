# Engineering ledger — CI source-only temporal proof fix

- Date: 2026-10-23
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Fingerprint: `delivery|ci|semconv-accepted-invalid-task-clock-and-missing-error-type|20261023-v1`
- Owner: `engineering|cicd|semconv-timestamp-proof-guard|20261023-v1`
- Existing producer: one hourly Powerhouse repository Janitor, `tools/delivery/ci-throughput-telemetry.mjs`
- Fix: reject malformed source job creation and unbounded timestamps; add release-candidate `error.type` for failure/timeout
- Non-effects: no CI mutators, network exporters, external telemetry, agent schedules, new databases or release gate bypass
- Proof: exact-head regression + protected merge + independent existing Janitor output; not yet independently observed in production
