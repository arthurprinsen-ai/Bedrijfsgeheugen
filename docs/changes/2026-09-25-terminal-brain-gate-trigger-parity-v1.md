# Terminal Brain gate trigger parity

Date: 2026-09-25
Fingerprint: `terminal-brain-gate-trigger-parity-v1`

## Incident

After PR #3108 was protected-merged, all exact-head critical PR gates were green and the merge SHA passed Main Write Integrity, Powerhouse Skill Projection and Brain foundation verify. The terminal closure workflow nevertheless remained inside `Verify exact-head critical delivery gates`.

## Root cause

`obligation-terminal-closure.yml` required an exact-head `Unified Brain Delivery` run filtered to `event=pull_request`. The referenced `unified-brain-delivery.yml` workflow is dispatch-only, so that evidence can never be produced by a pull-request event.

## Repair

Terminal closure now:
1. accepts a successful exact-head Unified Brain Delivery run when one exists, without inventing an event type;
2. otherwise requires successful exact-merge Brain foundation verify evidence from the main push;
3. remains fail-closed for failed or missing evidence.

No website, Netlify, Supabase or application runtime behavior is changed.
