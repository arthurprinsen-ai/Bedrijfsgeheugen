# Development ledger — post-merge CodeQL single-flight

- Date: 2026-09-25
- Obligation: post-merge-codeql-terminality-20260925
- Fingerprint: `delivery|post-merge-codeql|single-flight-terminality|v1`
- Root cause: run-id-isolated CodeQL push concurrency plus ambiguous active-security terminality.
- Recovery: PR #3101 was closed/reset without merge; reconstruct minimal proven delta from current main.
- Additional current-main repair: import `isHardAssetFailure` in the targeted website regression without reverting newer browser logic.
- Terminal intent: protected merge, exact-main security/readback, Powerhouse/Brain/skill discoverability.
- Client transport continuation: response transport interruption is non-terminal; resume canonical repository state and continue to the terminal delivery contract.
- Metadata repair: recovery lineage references predecessor PR 3101 with canonical numeric Supersedes syntax before rerunning admission.
- Lineage correction: PR 3111 does not supersede closed PR 3101 because its CodeQL recovery already landed on main via PR 3106; this PR is a new continuation delta on current main.
