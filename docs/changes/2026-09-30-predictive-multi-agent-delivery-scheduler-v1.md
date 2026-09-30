# Predictive multi-agent delivery scheduler v1

Before every material write, Powerhouse now predicts obligation ownership, changed-path/contract/resource overlap, queue pressure and workflow fan-out. One obligation has one active writer; different non-conflicting obligations build in parallel; only overlapping terminal landing is serialized.

Remote workflow waiting is asynchronous. A resumable checkpoint is persisted, independent work continues, exact-head CI is reused and delivery resumes automatically. Newer main supersedes stale reversible production snapshot work.

System Map-only writeback no longer wakes unrelated Business OS and portal-native suites. This reduces fan-out while preserving required checks.


## Governance-only terminal closure

The post-merge obligation terminalizer now distinguishes deploy-relevant runtime changes from governance/control-plane-only changes. A governance-only merge proves production applicability through current-main containment and does not poll Netlify for a website deployment that should not exist. Runtime-affecting merges keep the exact production release/readback requirement.
