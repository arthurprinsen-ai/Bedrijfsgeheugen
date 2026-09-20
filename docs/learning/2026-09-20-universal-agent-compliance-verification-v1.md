# Universal AI chat/agent compliance assurance

## Purpose

Powerhouse must be able to prove that material work performed by chats and agents is actually logged, documented, learned from and propagated to the execution skills. Human trust must not depend on a chat saying that it completed those steps.

## Canonical evidence chain

For material repository-backed Powerhouse work, the required chain is:

`material action → Brain learning → development/activity ledger → human documentation → deterministic skill projection → protected delivery → production/provider readback → terminal evidence`

A missing mandatory element is not completion.

## Existing enforcement verified on main

The current control plane already contains the following enforcement:

1. `scripts/brain/material-writeback-closure-guard.mjs` detects missing closure artifacts and fails closed.
2. Semantic learning is checked for concrete root cause, prevention and evidence rather than file presence alone.
3. `.github/workflows/required-test.yml` runs the closure guard before independent delivery lanes.
4. The terminal closure workflow requires production evidence and learning-to-skill projection before `LIVE_BEWEZEN`.
5. The Powerhouse continuity skill treats a missing or stale skill projection as non-terminal.

## Operational interpretation

Agents and chats using the canonical delivery path cannot legitimately claim terminal completion when durable writeback is missing. The next worker should resume from canonical state, not from conversational memory.

## Assurance boundary

This is strong assurance for material work that passes through the canonical repository-backed Powerhouse path. It is not a claim that every arbitrary third-party action, ad-hoc external operation or chat-only statement is automatically observable. Such operations must be brought under the same run/obligation/evidence contract to receive identical guarantees.

## Prevention rule

Never accept \"the agent says it did it\" as terminal evidence. Require machine-readable closure state and independently readable artifacts.
