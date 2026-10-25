# Release, Deployment and Production Readback

## Objective
Never conflate a successful GitHub CI/release with an actual Netlify deployment, or a deployment with verified production health.

## Required three dimensions
1. GitHub release: merged AND required checks passed (otherwise pending/failed).
2. Netlify deployment: required? If explicitly false, show NOT_REQUIRED (neutral, not an incident) with a reason. If true, report provider-verified success, pending or failure. If unknown, report UNKNOWN.
3. Production readback: if deployment not required, NOT_REQUIRED. Otherwise PASS only when a recent independent production fetch matches the expected release identifier; a successful CI run or Netlify API response is insufficient.

## Source of truth and UI contract
Use `tools/netlify/release-status.mjs` as the common status classifier; UI should render three individually labeled indicators plus overall. Status values: passed, pending, failed, not_required, unknown.
Display timestamp, GitHub SHA, Netlify deploy ID, production release ID when available; never invent them. Document no-deploy reason. Treat unknown as neutral/pending, not green. Never bypass required checks or fabricate readback.

## CI/CD agent behavior
- Determine whether changes affect deployable output using the existing repository-specific deployment policy and diff/build evidence. Do not guess from commit title.
- When no production deployment is needed, set `deployment.required=false` and a concrete reason. Do not trigger Netlify; do not page on this skip.
- When required, deploy through authorized protected process and independently validate production before green.
- Run `node --test tests/netlify/release-status.test.mjs`.
- Integrate this classifier into the existing dashboard adapter and replace any legacy boolean 'deployment failed when skipped' logic; use the same contract in the agent reporting layer.

## Acceptance criteria
A merged green docs-only CI run has three clear statuses PASS / NOT_REQUIRED / NOT_REQUIRED and green overall, while required-but-missing deploy or readback cannot be green. Failed provider deployment or fresh production mismatch is red. Stale readback stays pending.
