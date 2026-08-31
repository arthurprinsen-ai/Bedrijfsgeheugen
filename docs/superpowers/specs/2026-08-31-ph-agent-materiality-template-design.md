# PH Agent Caller-Side Materiality Template Design

## Goal
Prevent PH01-PH16 from paying BG168 learning cost for non-material outcomes while preserving the exact primary result and keeping learning fail-open.

## Evidence
All PH01-PH16 stable runners were individually read back from Make. Each currently follows cache-first context → AI runner → unconditional BG168 learning dispatch → ReturnData. Make reports the team as paused while scenarios remain logically active, so pause is containment, not structural remediation.

## Canonical topology
`Start → cache-first context → AI → deterministic materiality classifier → branch`

- NON_MATERIAL: return exact AI result; BG168 calls = 0.
- MATERIAL: BG168 at most once; return exact AI result.
- BG168 unavailable/error: return exact AI result.
- Unknown classifier outcomes default to MATERIAL.

## State and rollout
Agents move through `UNGUARDED → GUARDED_BLUEPRINT → RUNTIME_PROVEN`; `EXEMPT` requires explicit evidence. Rollout is 1 → 2 → 4 → 8 → 16. Stop on primary-result regression, unexpected BG168 calls, credit-slope breach, or 429 burst. Full resume remains fail-closed until every required agent is runtime-proven/exempt and current bounded-cost evidence exists.

## Brain memory architecture
The full contract remains canonical in `config/ph-agent-materiality-template-v1.json`. Mandatory preflight loads only `brain/learning/ph-agent-materiality-preflight-v1.json`, a bounded projection containing decision-critical fingerprints, blocker/prevention and a pointer to the full contract. The fixed preflight byte budget is not increased merely because learning grows.

## Safety
No big-bang activation, no autonomous paid Make capacity, no secret/capability persistence, and ambiguous state-changing 429/5xx requires readback before retry. Blueprint/CI green never substitutes for runtime evidence.
