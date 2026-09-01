# Estate-wide Closed-loop Learning Architecture

## Goal
Every current and future Powerhouse agent, Make scenario, GitHub workflow, Netlify delivery path, portal/backend service and external adapter must use one shared learning loop so material failures are detected, normalized, deduplicated, repaired where safe, verified and reused before future execution.

## Canonical flow
`signal -> normalize -> fingerprint -> known-error match -> stateful dedupe -> owner -> bounded self-heal -> regression test -> outcome verification -> BG94/BG168 -> BG166 -> BG167 -> next-run preflight`

BG94 is the universal compatibility ingress for runtime/error envelopes. BG168 is the material outcome router. BG166 is the canonical deduplicating Error & Learning Ledger writer. BG167 is the current shared team projection. No second persistent memory is permitted.

## Coverage
Coverage is estate-wide and registration-driven. BG159's dynamic Make inventory is the discovery layer for Make scenarios. Repository components use the Brain delivery/component registry. A component is not production-ready unless it declares or inherits: shared-context preflight, error/outcome ingress, fingerprinting, owner, idempotency/dedupe, outcome verification and learning writeback.

Do not reintroduce retired Gmail/polling runtime guards. Per-scenario polling is prohibited as a default because it multiplies Make operations. Prefer event-driven dispatch from managed agents/scenarios and cheap inventory/change detection; deep inspection runs only on changed/error evidence.

## Learning record
Every material error/recovery/improvement normalizes to:
- `fingerprint`
- `event_kind`
- `stage`
- `component_type`
- `component_id`
- `owner`
- `reason`
- `rootCause`
- `failedApproach`
- `fix`
- `preventionRule`
- `regressionTest`
- `evidence`
- `status`
- `first_seen`
- `last_seen`
- `last_changed`
- `evidence_hash`
- `retry_budget`
- `required_intervention`
- `next_escalation_at`

Secrets, credentials, PII and irrelevant raw conversation text are forbidden.

## Intelligence layers
1. **Known-error retrieval:** match-before-hypothesis from BG167/canonical repo lessons.
2. **Causal learning:** root cause + failed approach + proven fix + prevention rule.
3. **Outcome learning:** verify external intended result; technical success alone is insufficient.
4. **Regression intelligence:** convert proven incidents into tests/gates/contracts.
5. **Cost intelligence:** dedupe before write/refresh; no fleet-wide expensive polling; no identical retry without changed evidence.
6. **Opportunity intelligence:** improvements/experiments use the same evidence, verification, rollback and writeback loop.

## Self-heal policy
Safe repairable errors automatically continue through repair and production verification. Maximum two identical retries per hypothesis. Hard boundaries remain credentials/OAuth/permissions, security weakening, destructive/irreversible data, paid resource increases and legally/financially binding actions.

## Enforcement
`config/universal-closed-loop-learning.json` is the machine-readable contract. `scripts/brain/validate-universal-closed-loop-learning.mjs` fails closed when mandatory stages, routers, learning fields, dedupe rules, cost guards or forbidden architectures drift. CI runs this validator on every relevant change.

## Make integration
BG94 must remain active as universal error ingress and dispatch every error envelope to BG168. BG168 must route material events to BG166. BG166 must dedupe before persistent write and trigger BG167 refresh only for genuinely new learning. BG159 remains the low-cost auto-discovery inventory and marks every discovered Make scenario with the canonical learning router/error ledger metadata.

## Done criteria
The architecture is GREEN only when:
1. the machine contract validates;
2. the validator has regression tests;
3. BG94->BG168 runtime canary succeeds;
4. BG166 writer shows downstream successful write/coalesce behavior;
5. BG167/shared context is refreshable after new learning;
6. the governed candidate is promoted through BG169;
7. Netlify production runs exact promoted main SHA with ready/secret-scan evidence.
