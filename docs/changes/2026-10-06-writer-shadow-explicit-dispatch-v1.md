# Writer Shadow explicit dispatch — 2026-10-06

Repository Writer Candidate Shadow no longer starts for every pull request. It is dispatch-only and receives immutable PR/base/head/ref identity.

The four writer paths that previously relied on the global PR trigger now invoke one canonical dispatch helper after candidate PR creation. The three writers that already self-dispatched remain unchanged.

Result: ordinary PRs no longer allocate a skipped Shadow workflow, while all seven writer candidates retain fail-closed read-only shadow verification.
