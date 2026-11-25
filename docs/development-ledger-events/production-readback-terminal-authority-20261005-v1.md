# Development ledger — production-readback-terminal-authority-20261005-v1

- Main before recovery: `eb51760dc95db37b8e2ee1f02b30134dbc035782`.
- Predecessor: PR #3788.
- Production Release Readback run `37355455197`: success.
- Canonical brand shell live readback run `37355455178`: failure.
- Failure 1: `Directie & AI Workshop` raw-string assertion did not accept live `&amp;` encoding.
- Failure 2: final supersession check rejected verifier-only descendant paths already declared safe in the canonical production-readback contract.
- Fix: single-source verifier-only authority + parsed visible heading semantics.
- Closure condition: successor exact-HEAD CI green -> protected auto-merge -> Production Release Readback green -> Canonical brand shell live readback green.
