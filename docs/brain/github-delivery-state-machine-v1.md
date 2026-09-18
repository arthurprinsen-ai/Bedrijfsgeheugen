# GitHub delivery state machine v1

Fingerprint: `github|delivery-state-machine|parallel-build-serialized-landing|v1`.

GitHub is the executable delivery state machine, not a chat archive or second learning database. Candidate identity is `Obligation-ID + exact head SHA + main epoch`; branch names are labels only.

Normal operating state: 0–3 active product PRs, at most one terminal writer per obligation, maintenance work outside the product WIP budget, and no durable backlog of stale recovery PRs.

The pipeline is two-speed: cheap admission before expensive CI, then a serialized terminal landing guard. Development stays parallel while landing uses an optimistic CAS against the current main epoch.

Terminal completion is not merge. The same obligation lineage continues through main containment, deploy/promotion readback, runtime verification, outcome evidence, learning projection and skill projection. Only then may it become terminal.
