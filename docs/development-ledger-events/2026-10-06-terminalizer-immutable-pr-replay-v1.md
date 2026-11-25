# 2026-10-06 — Immutable merged-PR terminalizer replay

Obligation: `linkedin-company-fresh-org-oauth-terminal-20261006`

Observed:
- #3890 protected-merged as `22d57fdcb0e7344914288091a75319c1198a73ef`;
- its canonical Production Release Readback succeeded;
- terminalizer run `37458182329` failed only because `config/powerhouse-quality-surface-contracts.json` was misclassified;
- #3892 protected-merged classifier repair as `d95040ed2f6cbc55a0ff4ba1fc93d2d4790f0536`;
- an ordinary rerun of the old #3890 workflow would still use the old event SHA/workflow definition.

Implemented:
- opt-in `Terminal-Replay-PR` resolution inside the same canonical terminalizer;
- immutable fetch of one already-merged target PR;
- target body/head/merge identity reused by the existing terminalization steps;
- controller PR identity preserved separately in terminal evidence;
- default current-PR path unchanged.

Closure:
- exact-HEAD gates on this controller candidate;
- protected auto-merge only;
- automatic replay target #3890 from the merged controller event;
- require uploaded `obligation-terminal-evidence-3890` with `terminal_status=LIVE_BEWEZEN`.
