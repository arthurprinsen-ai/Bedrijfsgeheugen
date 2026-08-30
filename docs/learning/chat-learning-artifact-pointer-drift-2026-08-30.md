# Chat learning artifact pointer drift — 2026-08-30

Fingerprint: `brain|learning-index|canonical-artifact-pointer-drift-v1`

## Symptom
A machine-readable learning/completeness index listed `brain/learning/incidents/connector-mutation-routing-guard-2026-08-30.json`, but that file did not exist. The durable incident had actually been persisted as `brain/learning/incidents/connector-mutation-tool-routing-misfire-2026-08-30.json`. Shared Agent Memory CI therefore failed with ENOENT even though the underlying learning existed.

## Root cause
Artifact identity and the index pointer evolved separately. The completeness contract verified referenced files by path, but the producer that wrote the incident used a different canonical filename. This created a false completeness claim: the index said the learning was canonical while its pointer was not resolvable.

## Proven repair
Update the canonical artifact pointer to the exact persisted incident path. Do not duplicate or rename the incident solely to satisfy a stale pointer. Re-run the shared-memory contract against the current PR merge ref.

## Prevention contract
- every canonical learning index entry must resolve to an existing non-empty artifact;
- artifact identity is exact path + fingerprint, not approximate title similarity;
- co-change an index pointer when a canonical artifact is renamed or replaced;
- never create a duplicate incident file merely because a stale pointer is broken;
- CI failure `ENOENT` on a canonical artifact is a governance/data-lineage defect, not an infrastructure retry condition;
- after repair, verify the merged current-main view because pointer drift can be introduced by non-overlapping moving-main changes.

## Related recovery evidence
During PR #680 exact merge-ref verification, Shared Agent Memory Tests first exposed a stale Make credit-storm version assertion (`v1` versus current `v1.1`). After that fix, the next run exposed this stale canonical artifact pointer. Both failures were repaired in the same canonical continuity candidate rather than weakening CI or retrying unchanged.

## Delivery rule
When a verification failure is caused by current-main contract evolution outside the original candidate scope, preserve the candidate if there is no direct file/semantic conflict, incorporate only the minimal compatibility repair, and rerun exact-head verification. Rebuild from scratch only when actual overlap/conflict requires it.
