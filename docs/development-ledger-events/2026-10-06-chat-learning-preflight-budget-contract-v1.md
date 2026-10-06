# Development ledger — chat-learning preflight budget contract alignment

- Date: 2026-10-06
- Obligation: chat-learning-preflight-budget-contract-20261006-v1
- Failure: Chat learning preflight / Preflight compiler contract failed after #3927 because the test still asserted `sources.length <= 96`.
- Root cause: duplicated source-budget truth in the regression script.
- Fix: read source and byte limits from `config/brain-chat-learning-contract.json`.
- Safety: explicit stricter caller overrides still fail closed.
- Regression: `scripts/brain/test-chat-learning-preflight-compiler.mjs`.
