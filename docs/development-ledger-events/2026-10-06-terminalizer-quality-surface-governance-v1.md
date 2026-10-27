# 2026-10-06 — Terminalizer quality-surface governance repair

Obligation: `terminalizer-quality-surface-governance-20261006-v1`

Observed:
- LinkedIn company terminal PR #3890 protected-merged as `22d57fdcb0e7344914288091a75319c1198a73ef`;
- exact-HEAD Required test and CodeQL were successful;
- Production Release Readback run `37458182881` succeeded;
- Powerhouse Obligation Terminalizer run `37458182329` failed;
- the only unknown path reported was `config/powerhouse-quality-surface-contracts.json`.

Root cause:
- the terminalizer governance classifier omitted the canonical quality-surface registry, so repository-only control-plane state was treated as an unwired runtime provider.

Repair:
- add exactly that registry to the governance classifier;
- preserve fail-closed behavior for every other unknown runtime path;
- permanently regress the classification in `tests/brain-terminalizer-quality-surface-governance-v1.test.mjs`.

Closure sequence:
- exact-HEAD gates;
- protected auto-merge;
- rerun failed #3890 terminalizer;
- require terminal evidence for merge SHA `22d57fdcb0e7344914288091a75319c1198a73ef`.
