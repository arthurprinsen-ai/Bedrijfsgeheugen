# Same-repository reviewable writeback standard

**Date:** 2026-09-25  
**Fingerprint:** `powerhouse|same-repo-material-writeback|reviewable-lineage|v1`

## Why

Powerhouse already required material Brain learning, development-ledger evidence, human documentation and skill projection. The remaining ambiguity was location and lineage: a future agent could interpret a chat message, local note or external document as sufficient documentation.

## Standard

All durable closure now stays in the canonical Bedrijfsgeheugen repository and the same obligation/candidate lineage. For every material change this means: skill rule/projection + Brain learning + development ledger + human-readable documentation.

The rule applies to all current and future chats, agents, workflows, autonomous workers and skills. Closure is reviewable through Git history and protected delivery instead of depending on conversational claims.

## Existing enforcement reused

- material-writeback closure guard;
- universal learning/writeback regression suite;
- deterministic learning-to-skill projection;
- protected merge and terminal readback contracts.

No parallel knowledge store is introduced.

## Failure state

If any required closure artifact is absent, the run remains `WRITEBACK_INCOMPLETE`; it may not be reported as `LIVE_BEWEZEN`.
