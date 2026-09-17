# Universal Agent/Chat Ingress v1 — Design

## Problem

Powerhouse policies already require chat-learning preflight, shared context, canonical operation binding, completion manifests and learning writeback. The remaining gap is runtime proof: a control-plane binding proves an operation entered through `brain_create_operation`, but does not prove that the current run executed the canonical learning preflight or that the same ingress identity is carried into postflight completion.

## Goal

Every material Powerhouse-managed chat/agent/workflow run must carry a fail-closed ingress receipt created from the canonical `BRAIN-CHAT-LEARNING-PREFLIGHT-v1` packet. That receipt must be bound to runtime identity and candidate identity, and the same receipt must be required by universal completion before terminal success.

## Scope

This change covers Powerhouse-managed runtimes and the existing Agent Fabric/control-plane path. It does not claim that repository code can rewrite the native ChatGPT product runtime. Native chat sessions remain externally hosted; when they invoke Powerhouse material execution, that execution must enter through the same managed ingress/control-plane contract.

## Architecture

1. Add `scripts/brain/powerhouse-universal-runtime-ingress.mjs` as the single in-repo runtime contract.
2. `beginMaterialRun()` compiles the existing canonical chat-learning preflight, validates actor/run/candidate identity, and returns an immutable content-addressed ingress receipt.
3. `completeMaterialRun()` requires that same receipt, validates identity continuity, and delegates terminal validation to the existing universal completion gate.
4. The existing Agent Fabric gateway requires a runtime-ingress adapter for material commands and injects the resulting receipt into command payloads. Queries remain read-only and do not require material admission.
5. Add `config/powerhouse-universal-ingress-v1.json` declaring the covered actor classes and invariant that material commands cannot execute without ingress evidence.
6. Add regression tests proving fail-closed behavior, identity continuity, immutable digesting, and Agent Fabric enforcement.
7. Wire the tests into Shared Agent Memory CI so future bypasses fail pull requests.

## Data flow

`material request -> beginMaterialRun -> canonical chat-learning preflight -> ingress receipt -> Agent Fabric command -> existing canonical operation/control-plane path -> work/outcome -> completion manifest + same receipt -> completeMaterialRun -> universal completion gate -> terminal status`

No new persistent memory, queue, calendar or business-truth store is introduced. The receipt is evidence/projection only; canonical state remains in the existing Brain/control-plane stores.

## Receipt contract

Required fields: `version`, `status`, `runId`, `actorKind`, `actorId`, `candidateId`, `preflightVersion`, `preflightStatus`, `preflightDigest`, `receiptDigest`, `observedAt`. The digest is SHA-256 over stable identity/preflight fields, excluding `observedAt`, so equivalent evidence can be compared deterministically while freshness remains separately visible.

## Failure semantics

- Missing/invalid actor, run or candidate identity: fail closed.
- Preflight not `READY`: fail closed.
- Unsupported actor kind: fail closed.
- Material Agent Fabric command without successful ingress: fail closed.
- Completion with a receipt for another run/candidate/actor: fail closed.
- Universal completion failures remain authoritative and are not weakened.

## Test strategy

TDD: first add regression tests and CI wiring that fail because the ingress module/config and gateway enforcement do not yet exist. Then add the minimal implementation and update gateway tests. Final evidence is the protected PR workflow run on the exact head plus merge/main readback if all required checks are green.
