# 2026-10-22 terminal supersession-lineage recovery

- Parent: #4681; original protected-merged source PR #4697; retired #4686; first new actual failed provider replay #39840439339 / job #120039732278.
- Root cause: terminalizer incorrectly rejects a superseded unmerged predecessor even if its precise migration filename has been replaced by the merged terminal successor. Historical SHA differs from merged SHA; provider applied terminal version `20261022173500`.
- One scoped source correction: exact terminal merge path containment, checked-out file presence, strict failure for other unmerged migration paths and all security/readback checks unchanged.
- Machine verification: `tests/brain-terminal-supersedes-migration-coverage-v1.test.mjs` in canonical historical/shadow/canary.
- State: SOURCE CANDIDATE, no protected merge or production closure claimed.
