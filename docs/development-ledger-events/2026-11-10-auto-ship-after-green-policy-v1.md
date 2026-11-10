# Delivery event — green-gated autonomous promotion (2026-11-10)

- Obligation: `delivery|governance|green-gated-no-reapproval|20261110-v1`
- Original delivery: protected GitHub PR #5589; no second executor or deployment route.
- Scope: `AGENTS.md`, `docs/brain/groen-draaiboek.md`, `.agents/skills/powerhouse-self-improvement-layer/SKILL.md`, `tests/brain-groen-draaiboek-20261108.test.mjs`, canonical Brain learning record, and these two documentation records.
- User decision: do not request a second permission to ship an ordinary reversible change after every applicable security, review, quality, CI, and provider authorization gate passes. The canonical authorized writer must promote through the existing protected merge and production process; independent exact-SHA/provider/function readback and original consumer ACK are required.
- Evidence: initial Required run `42864876810` failed in canonical learning admission because the regression expected the playbook pointer within the first 2,500 characters of `AGENTS.md`; the added policy header displaced the pointer to offset 3,841. Code change `efc39b84eb1645cd9343c8cfca3ab2341c6935e1` inserted the canonical pointer near file start, preserving the original regression requirement.
- Next Required run `42865820314` passed canonical learning but stopped at `Enforce canonical integration closure at protected admission`. Root cause: the original change did not include the mandatory append-only ledger plus human-readable documentation alongside the existing Brain learning file.
- Correction: this event and the matching `docs/changes/2026-11-10-auto-ship-after-green-policy-v1.md` are added in the same PR. The original closure/security gates remain unchanged; no bypass, direct-main write, new scheduler, or second delivery lane.
- Regression: `tests/brain-groen-draaiboek-20261108.test.mjs`; protected Required integration and canonical-learning admission gates must succeed again on the exact updated head.
- Deployment / real-world effects: PENDING_VERIFICATION. A green preview, CodeQL, or successful merge alone is not proof of live promotion. Original Brain/Heartbeat/Portal ACK and independent production SHA/provider readback must follow.
- Prevention: future policy-changing PRs must include all three closure artifacts (semantic Brain learning JSON, append-only ledger, human-readable change note) from the first candidate, and preserve the first-page AGENTS entrypoint.
- Owner: existing authorized terminal delivery owner and original ONE BRAIN obligation; no new owner.
