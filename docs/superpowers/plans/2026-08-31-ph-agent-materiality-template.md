# PH Agent Caller-Side Materiality Template Implementation Plan

**Goal:** Replace unconditional PH01-PH16 BG168 dispatch with one canonical caller-side materiality pattern while preserving primary results.

**Spec:** `docs/superpowers/specs/2026-08-31-ph-agent-materiality-template-design.md`

- [x] Define fail-closed canonical contract for 16 agents and rollout 1→2→4→8→16.
- [x] Add TDD regression requiring NON_MATERIAL=0 BG168, MATERIAL≤1 and primary-result independence.
- [x] Keep full canonical truth separate from bounded preflight projection after fixed 256 KB preflight budget rejected full-contract linking.
- [ ] Verify compact projection in Shared Memory, Brain foundation and BRAIN delivery on current-main successor.
- [ ] Read inactive Make canary `7165093`; require classifier before BG168, direct NON_MATERIAL return, ≤1 MATERIAL BG168 call and fail-open primary return. Do not activate.
- [ ] Mark canary `GUARDED_BLUEPRINT` only after exact blueprint/config readback; runtime flags remain false.
- [ ] When Make capacity safely permits, prove NON_MATERIAL=0 BG168, MATERIAL≤1 BG168, learning-failure primary output and bounded credit slope/no 429.
- [ ] Roll out production callers in batches 1→2→4→8→16 with exact readback after every atomic mutation and stop-on-regression gates.
- [ ] Resume full service only when all required agents are RUNTIME_PROVEN/EXEMPT and current cost/runtime acceptance is green.
- [ ] Persist runtime evidence through canonical Brain/BG166 when Make capacity allows; never buy capacity autonomously for proof.
