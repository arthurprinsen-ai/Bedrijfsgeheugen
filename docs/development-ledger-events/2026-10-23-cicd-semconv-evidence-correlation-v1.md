# Delivery ledger — CI job semantic evidence reuse

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
- Writer owner: `engineering|cicd|semconv-readonly-provider-proof|20261023-v1`.
- Scope: existing Janitor CI collector + pure projection helper + one regression suite + cumulative Brain learning and documentation.
- No new CRON, agent, connector, queue, provider authorization, network telemetry exporter or CI check bypass.
- Baseline authority: existing executed GitHub Actions jobs only, sampled metadata is not a customer outcome.
- Security/privacy: exact run IDs and commit SHAs, validated repo string, bounded job names; no customer data.
- Fail closed: provider partial, missing timestamps, insufficient distinct attempts, malicious names, duplicated jobs, skipped placeholders.
- Result initially CANDIDATE; required exact-head CI, protected merge and post-merge artifact readback before production claim.
