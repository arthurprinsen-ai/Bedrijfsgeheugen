# Development ledger — product-led learning recovery

- Date: 2026-09-30
- Obligation: `powerhouse-product-led-home-20260930`
- Root cause: learning canonicalization requires replay tests under `tests/brain-*.test.mjs`; the original regression filename did not satisfy that contract.
- Fix: add `tests/brain-product-led-home-v1.test.mjs` and bind the product-led learning record to that canonical replay.
- Prevention: every new machine-enforceable Brain learning must reference an existing `tests/brain-*.test.mjs` historical replay before terminal delivery.
- Public UI impact: none.

- Delivery-event refresh: scope metadata and terminal writer lease re-bound to the final recovery head before rerunning Required test.
