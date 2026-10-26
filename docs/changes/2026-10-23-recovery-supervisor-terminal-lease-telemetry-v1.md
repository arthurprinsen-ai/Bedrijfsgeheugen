# Recovery Supervisor missing terminal writer lease — typed observability

Owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Canonical precedent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4793 (merged)
Held duplicate/negative evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4792

## Verified gap
The actual native-CAS supervisor run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39960974891 contained missing-terminal-lease warnings for #4772 and #4778. Current six-run Janitor collection detects several drift and CAS classes but ignores those warnings. As a result an otherwise successful supervisor run can conceal the *reason* green PRs remain unmerged.

## Narrow source repair
The existing `parseSupervisorAnnotations` now reads only strict ISO timestamped GitHub warning/notice/error records, and accepts the exact `PR#<number> has no exact active terminal writer lease; automatic refresh forbidden.` provider annotation. No shell echo, arbitrary log prefix, malformed PR number or message suffix may become a typed event. The collector deduplicates by run, PR and event category, and includes `missing_terminal_lease_runs` and `repeated_missing_terminal_lease` in each PR's existing read-only summary. Repeated signals require distinct GitHub supervisor run IDs; success in the supervisor job is not release proof.

## Safety and acceptance
- Exactly the existing Recovery Supervisor, native `expected_head_sha` and capped recovery attempts; not changed here.
- Exactly the existing hourly Repository Janitor and six-run budget; no extra provider GET, queue, agent or scheduler.
- No automated assignment or release of another owner's writer lease and no mutation of tenant, portal, Netlify or Supabase.
- Regression: `node --test tests/brain-recovery-supervisor-telemetry-v1.test.mjs`, followed by Required and CodeQL on exact candidate HEAD.
- Protected squash merge plus independent source readback required. Operational telemetry is proven only after actual **scheduled** Janitor artifact readback, not by unit tests. Compare before/after drift and time-to-merge only when valid independent baselines exist.

Official source: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
