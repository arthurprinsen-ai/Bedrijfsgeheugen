# Daily blog CI self-heal — 2026-10-05

## Failure
The canonical daily blog candidate could remain open with protected check `test` expected because the PR was created by a workflow token and follow-on PR CI was not guaranteed to start.

## Structural prevention
The publisher now reconciles the existing business-date PR hourly, reads immutable PR identity first, and dispatches the existing required-test workflow only when the exact head lacks an active/successful `test` check. Required-test accepts immutable recovery inputs and passes them into the existing hygiene gate. Branch protection, auto-merge, dedupe and production readback remain fail-closed.

## Invariant
One business date → one candidate branch/PR → one exact-head required-test flight → protected merge → production readback. No bypass and no duplicate publication.
