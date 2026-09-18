# GitHub delivery state machine v1

Fingerprint: `github|delivery-state-machine|parallel-build-serialized-landing|v1`.

GitHub is the executable delivery state machine, not a chat archive or second learning database. Candidate identity is `Obligation-ID + exact head SHA + main epoch`; branch names are labels only.

Normal operating state: 0–3 active product PRs, at most one terminal writer per obligation, maintenance work outside the product WIP budget, and no durable backlog of stale recovery PRs.

The pipeline is two-speed: cheap admission before expensive CI, then a serialized terminal landing guard. Development stays parallel while landing uses an optimistic CAS against the current main epoch.

Terminal completion is not merge. The same obligation lineage continues through main containment, deploy/promotion readback, runtime verification, outcome evidence, learning projection and skill projection. Only then may it become terminal.

## Production proof — 2026-09-18

PR #2166 closed the remaining post-merge gap and merged candidate `5e7dcd5d118982cc8641d14c88995d4838e2ab4b` as main SHA `c3ecd9a00a37904249ebd3c4f06d3334f96400c4`.

The generic `Obligation Terminal Closure` then proved main containment, waited for canonical `Production Release Readback` run `35350501725`, wrote immutable artifact `obligation-terminal-evidence-2166`, released the writer lease and wrote `Terminal-State: LIVE_BEWEZEN` back to the PR. Skill projection was correctly recorded as not applicable for that implementation merge because no canonical learning source changed in that merge.

This proof upgrades the learning status from pending to `ACTIVE_PREVENTION_PROVEN`. Future agents must treat merge, auto-merge, queued CI and deploy-start as non-terminal states and must reuse the same obligation lineage through terminal closure.
