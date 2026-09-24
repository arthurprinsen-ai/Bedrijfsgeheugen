# 2026-09-24 — LinkedIn cockpit autopilot v1

## Change
PR #2734 moves the LinkedIn revenue cockpit toward autonomous execution by integrating eligible cockpit actions into the existing canonical `powerhouse-social-publisher` path rather than creating a separate scheduler/task.

## Root cause
The cockpit already prioritized evidence-backed LinkedIn actions, but eligible actions were not consumed by the delivery path. This forced manual cockpit operation even when the connected Composio LinkedIn capability could execute a post reply.

## Prevention
- The cockpit is observability + exception handling; execution belongs in the canonical publisher.
- Atomically claim an action before provider execution.
- Execute only capabilities proven available in the connected provider.
- Keep unsupported DM/connection actions as explicit exceptions.
- Persist provider acknowledgement and canonical outcome evidence.
- Register runtime RPC surfaces in the quality contract.
- Require merge, deployment, and production runtime readback before LIVE_PROVEN.

## Evidence
- Implementation: `supabase/functions/powerhouse-social-publisher/index.ts`
- Contract coverage: `tests/linkedin-revenue-cockpit.test.mjs`
- CI: `.github/workflows/linkedin-revenue-cockpit-tests.yml`
- Quality surface registration: `config/powerhouse-quality-surface-contracts.json`
- Delivery classification: `config/brain-delivery-system.json`
- Pull request: #2734

## Outcome
The target state is hands-off operation for supported LinkedIn cockpit actions. Manual intervention remains only where LinkedIn/Composio does not expose the required authorized capability or where an evidence/safety gate blocks execution.


## Terminal production closure
- Protected merge: `350f90eb9b2c76a715530836a7d9c485c2ccdd42`.
- Supabase provider runtime: `powerhouse-social-publisher` v49 ACTIVE.
- Runtime SHA-256: `d7def61407cf27081a02bc0452c3b506a504e32e0051c86c09c97fc6285d6bf1`.
- Existing scheduler reused: cron job 62, `powerhouse-content-closed-loop-v1`, every 5 minutes.
- Runtime readback: production requests to `powerhouse-social-publisher` returned HTTP 200 after deployment.
- Canary: no eligible `reply_post` existed in the inspected queue; therefore no LinkedIn comment was emitted. Unsupported DM/connection actions remained fail-closed.
- Terminal classification: `LIVE_PROVEN_RUNTIME`; provider-side comment proof remains outcome evidence to append when the first eligible action occurs, not a reason to keep manual cockpit operation.
