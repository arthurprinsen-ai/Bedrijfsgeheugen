# Existing Janitor — fail-closed GitHub job-log fallback (2026-10-23)

## Actual defect
GitHub Actions Janitor run [39971461584](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39971461584) executed successfully after protected PR #4800 was merged. Its canonical `powerhouse-supervisor-execution-evidence.json` is partial because the first selected Supervisor run 39968527525 yielded `GITHUB_JOB_OR_LOG_READ_INCOMPLETE`. The exact completed job log 120464700413 is independently retrievable from the GitHub provider (87KB). The live system correctly claimed no zero-event result.

## Scope of repair
Within `tools/delivery/recovery-supervisor-telemetry.mjs`, the existing bounded reader first tries native `gh api` for the exact log; on failure or absence of timestamped provider lines, it tries `gh run view --job ID --log --repo OWNER/REPO`. GitHub CLI and GitHub REST document the redirect-backed logging contract. Any log with no genuine timestamped lines or more than 2MB fails closed, without manufacturing completed recovery, lower latency or release proof.

No new workflow, schedule, background actor, branch mutation, CI bypass or memory register. Preserve existing single-writer, native expected-head CAS, two-drift-attempt budget, independently rerun Required and CodeQL on a new PR head.

## Acceptance
Exact-head regression, protected Required and CodeQL, squash merge, main code readback, and **one real subsequent** hourly Janitor evidence artifact verifying non-partial collection. If GitHub provider denies both read methods, the report must remain partial. Workflow success alone is not customer production verification. Data-driven optimization needs independent baselines and outcome verification.
