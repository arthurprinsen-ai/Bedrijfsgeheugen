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
