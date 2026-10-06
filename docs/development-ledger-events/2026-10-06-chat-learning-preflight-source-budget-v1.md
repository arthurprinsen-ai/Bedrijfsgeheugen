# Development ledger — chat-learning preflight source budget v1

- Date: 2026-10-06
- Failure: material PR preflight failed at 97 sources because of a fixed 96-source limit.
- Root cause: source-count capacity did not evolve with the canonical learning graph although the independent 256 KB byte budget still had capacity.
- Fix: contract-owned 128-source ceiling plus unchanged 256 KB serialized packet ceiling.
- Regression: `tests/brain-chat-learning-preflight-source-budget-v1.test.mjs`.
- Safety: no learning, security, exact-head, release or production gate is weakened.
