# Exact-head critical merge gates v1

- Date: 2026-09-19
- Obligation-ID: required-exact-head-critical-gates-v1
- Incident evidence: #2331 merged while BRAIN was red; #2335 merged while BRAIN/CodeQL were still running.
- Root cause: native branch protection trusted only `test`, whose aggregator did not include sibling critical workflows.
- Change: `test` now waits for exact-head BRAIN + Powerhouse CodeQL completed-success evidence.
- Cost control: existing runs are polled read-only; heavy CI is not duplicated.
