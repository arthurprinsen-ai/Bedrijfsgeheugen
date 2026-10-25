---
name: deployment-capability-recovery
description: Evidence-bound production delivery when connected GitHub or Netlify tools cannot dispatch a deployment.
---

# Deployment capability recovery — canonical agent skill

## Trigger
When a deployment is requested but a connector only reads deploy status or cannot dispatch a GitHub Actions workflow, classify `DELIVERY_CONTROL_PLANE_CAPABILITY_GAP`. A missing connector action is NOT evidence of a Netlify deployment fault.

## Mandatory preflight
1. Read `AGENTS.md`, existing delivery/Janitor workflow rules, the target site's Netlify continuous-deployment configuration, production branch and exact commit SHA.
2. Inspect the provider's published deployment SHA, branch, state, timestamps, production URL and required checks; distinguish stale observations from current state.
3. Discover the current connector capabilities explicitly on each session. Never claim an unavailable API or tool executed.
4. Deduplicate under the existing incident/obligation and existing Repository Janitor owner; no parallel scheduler, shadow agent, repeated production push or new queue.

## Deterministic release routing
A. **Preferred: existing Git-connected Netlify CD.** If the authenticated and authorized GitHub connector supports an approved change or protected merge, use that established PR/merge path. The resulting push to the configured production branch should trigger Netlify Git CD *only if Git CD is enabled and deploys are not locked/ignored*. Do not create a dummy commit to force deployment.
B. **Existing approved dispatch**: if a tool supports `workflow_dispatch` and the existing repository workflow already authorizes this action, use the workflow's declared ref and inputs only after gates pass. A rerun of failed jobs is not a production deploy dispatch.
C. **Existing authenticated operational fallback**: an authorized operator may trigger a Netlify dashboard retry/build or approved build hook only when the source SHA and permissions have been verified. Build hooks must be kept secret, and can bypass request policies; never create, expose or invoke an unapproved hook.
D. **No authorized write path**: preserve the incident and mark `BLOCKED_CONTROL_PLANE_CAPABILITY` with required action and responsible owner. Read-only connectors cannot be magically promoted to writers. Do not use force push, direct production REST calls or an unreviewed manual CLI production deploy as a shortcut.

## Post-deploy proof
Require exact expected SHA (when exposed), immutable deploy ID, production context, `ready` published state, correct origin and live HTTP/application smoke check. A build started, provider ACK, preview success or a newly green CI run is not production readback. Recheck the live SHA and app functions; distinguish READY from PUBLISHED. If provider lacks commit metadata, keep source provenance UNVERIFIED until independently correlated.

## Prevention through existing Heartbeat/Janitor
During the *existing* scheduled delivery preflight, record connector capability matrix (GitHub dispatch, protected merge, Netlify deploy creation/retry, published readback), Netlify Git-CD linkage, deploy lock, ignore-build behavior and last published SHA. Alert only on real capability regressions or overdue releases, deduplicated by fingerprint. Include a regression test asserting absence of a write action yields BLOCKED, never success. No second scheduler and no bypass of Required, CodeQL, Supabase preview, RLS, consent or security gates.

## Skill/application evidence
For every relevant agent run record skill path + content SHA, selected path A/B/C/D, available tools, exact PR/head SHA, provider deploy ID, validation and final evidence status in the existing Brain/Heartbeat evidence chain. Missing evidence remains an open obligation.

## Closure
Only close after protected approval/merge as applicable, actual production publication and independent production readback. Never claim perpetual prevention; continued surveillance and bounded self-healing reduce recurrence risk.
