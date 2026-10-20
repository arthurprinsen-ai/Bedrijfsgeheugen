# Ledger — follow-up to PR #4227 anonymous browser preview

- Parent obligation: P0 #4215; predecessor #4227 merged main `8d22d5008781fda9f6fa37782bd9ee17303f130c` and live Netlify `6ac880610688f90008f79bcb` ready at exact source.
- Preview failure: workflow `37890400632`, job `113689804584`, `Verify approved deterministic browser parity`: 3 failures, 9 successes.
- Failing fixtures: native workspace coverage and mobile functional parity plus legacy algorithm parity incorrectly opened anonymous `compliance-governance`.
- Prevention: route positive anonymous probes only to unprotected workspaces; negative assertion must enforce fail-closed authorization in both suites.
- Changed scope: two existing integration browser specs and three evidence/ledger files.
- Gate: exact-head required tests and real preview readback; protected merge, exact-main Netlify deploy and production DOM readback. Do not count demo browser checks as signed-in two-tenant customer evidence.
