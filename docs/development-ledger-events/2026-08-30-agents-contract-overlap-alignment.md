# 2026-08-30 — AGENTS semantic contract overlap alignment

- type: CONTRACT_CHANGE
- fingerprint: agents-delivery-sync-rule-missing-declared-contract-overlap
- symptom: `AGENTS.md` documented merge conflict, changed-path overlap and declared dependency conflict, while `config/brain-delivery-system.json` and the canonical BRAIN Continuous CI/CD v2 specification also require declared semantic contract overlap.
- impact: a human or agent following only `AGENTS.md` could incorrectly treat semantic contract drift as non-conflicting.
- root cause: operating contract wording lagged behind the machine-enforced `syncRequiredWhen` policy introduced earlier.
- fix: align the `AGENTS.md` synchronization rule with all four machine-enforced causes and add a regression test.
- regression gate: `tests/agents-delivery-contract.test.mjs`
- rollback: revert the two alignment commits if the canonical machine policy changes deliberately.
- reusable lesson: when machine delivery policy changes, enforce parity with agent-facing operating rules using a test instead of relying on documentation review alone.
