# PH Agent Caller-Side Materiality Template Design

## Goal
Prevent PH01-PH16 from paying BG168 learning cost for non-material outcomes while preserving the exact primary agent result and keeping learning fail-open.

## Current evidence
All PH01-PH16 stable runners were individually read back from Make. Each currently follows the same topology: shared-context cache read → AI runner → `Share agent outcome with team learning` → ReturnData. No caller-side materiality gate exists. The Make team is capacity-paused while scenarios remain logically active (`isActive=true`), so pause is containment rather than structural remediation.

## Canonical topology
`Start Agent Task → cache-first shared context read → AI runner → deterministic materiality classifier → If/Else`

- NON_MATERIAL branch: return the exact AI result directly. BG168 calls = 0.
- MATERIAL branch: invoke BG168 at most once, then return the exact AI result.
- BG168 error handler: return the exact AI result. Learning failure must never suppress business output.

The classifier is deterministic and conservative. Known no-change/healthy/no-action markers are NON_MATERIAL; uncertainty is MATERIAL.

## Ownership
The template contract is canonical Brain policy. Individual PH agents are projections of that policy, not independent variants. A per-agent deviation requires explicit evidence-backed exemption.

## Rollout
1. Keep production PH01-PH16 paused/fail-closed while capacity is constrained.
2. Validate one inactive staging canary against the canonical topology.
3. Runtime proof for NON_MATERIAL: exact primary result, zero BG168 executions.
4. Runtime proof for MATERIAL: exact primary result, maximum one BG168 execution.
5. Runtime proof for BG168 unavailable/error: exact primary result still returned.
6. Confirm bounded credit slope and no 429 burst.
7. Roll out in batches 1 → 2 → 4 → 8 → 16 with exact blueprint readback after each batch.
8. Resume normal service only after every required agent is GUARDED and the staged acceptance evidence is current.

## Agent states
Each PH agent has one of:
- `UNGUARDED`: unconditional BG168 caller-side dispatch remains.
- `GUARDED_BLUEPRINT`: canonical branch topology is stored but runtime proof is incomplete.
- `RUNTIME_PROVEN`: required NON_MATERIAL/MATERIAL/failure-path evidence exists and cost slope is bounded.
- `EXEMPT`: only with explicit evidence-backed contract justification.

Resume is fail-closed while any required agent remains UNGUARDED or lacks required runtime proof.

## Cost and safety invariants
- NON_MATERIAL → 0 BG168 calls.
- MATERIAL → ≤1 BG168 call.
- Primary result is bit-for-bit/semantically exact relative to the AI runner output contract.
- Shared context stays cache-first; no BG167 rebuild per worker request.
- No big-bang reactivation.
- No autonomous paid Make-capacity increase.
- No secrets, credentials, tokens or capability values in repo learning or evidence.
- Ambiguous 429/5xx after mutation requires exact readback before retry.

## Testing
Repository regression tests must verify the template contract, all 16 inventory entries, rollout state machine, resume fail-closed semantics, and linkage into mandatory chat-to-Brain preflight. Make runtime tests are separate acceptance evidence and may not be replaced by blueprint or CI green.
