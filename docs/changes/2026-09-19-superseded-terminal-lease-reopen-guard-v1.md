# Superseded terminal lease reopen guard

An unmerged predecessor with an active terminal-delivery lease is no longer automatically resurrected when a canonical successor has already completed the same obligation.

The close guard now requires all of the following before allowing the predecessor to remain closed:
- a merged successor exists;
- the successor body has the same `Obligation-ID`;
- the successor body has exact `Supersedes: <predecessor PR>`;
- the successor's `Obligation Terminal Closure PR #...` workflow completed successfully.

Without all four proofs, the previous fail-closed auto-reopen behavior remains unchanged.
