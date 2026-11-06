# Action-specific guard in the existing delivery preflight — 6 November 2026

## Failure and owner
The canonical `tools/delivery-preflight.mjs` loaded PROVEN lessons but defaulted to four stages and never invoked the separate action matcher. PR #5493 added 19 system action triggers; PR #5490 supplied 15 GitHub lessons without action triggers. This meant lessons from VERIFICATION, WRITEBACK, GOVERNANCE, INTEGRATION, HANDOFF and OUTCOME could be stored without stopping the next matching unsafe action.

## One corrective route
- Extend existing `config/planned-action-triggers.json` to 34 triggers: 19 existing + 15 GitHub rules.
- Reuse `matchPlannedAction` from the existing `scripts/brain/planned-action-guard.mjs` inside `loadDeliveryPreflight`.
- Pass `plannedAction` and `acknowledgedPreventionRules`, or call `node tools/delivery-preflight.mjs shared --action "..."`.
- Surface cause and required fix, fail closed until every matching rule is acknowledged; remain honest that an acknowledgement is NOT independent execution evidence.
- Keep no-action preflight backward-compatible for inventory checks, but do not equate it with action clearance.
- Require regression in the original Required test workflow. No duplicate scheduler, token, preflight or registry.

## Verification boundary
Code candidate only until protected Required/CodeQL, merge and exact main readback succeed. Agent uptake, actual corrected actions, and provider/client outcomes must be independently observed. Existing GitHub and Supabase branch-preview controls remain mandatory.
