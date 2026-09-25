# Development ledger — repository-native borging for all agents/chats v1

Date: 2026-09-25
Obligation: `repository-native-borging-all-agents-v1`
Fingerprint: `powerhouse|repository-native-borging|same-lineage-reviewable|v1`

## Decision
All current and future material Powerhouse agents and chats must close work inside the same repository-backed delivery lineage. Canonical closure is not a chat statement and not an external-only note.

Required durable artifacts:
- Brain/Powerhouse learning;
- append-only development ledger;
- human-readable documentation;
- relevant skill projection or durable skill operating-principle update.

## Enforcement
The central continuity policy makes repository-native same-lineage reviewability an explicit invariant. AGENTS.md and the Powerhouse continuity skill mirror the operating rule. Regression coverage verifies that the rule remains present.

The existing material-writeback closure guard remains the pre-merge fail-closed enforcement path for material candidates.

## Terminal semantics
Missing any required repository-native closure artifact is `WRITEBACK_INCOMPLETE`. Such a lineage is not `LIVE_BEWEZEN` or `PRODUCTION_GREEN`.

External mirrors may exist, but they never replace repository-native authority.
