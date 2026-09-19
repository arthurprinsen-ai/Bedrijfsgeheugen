# Terminalizer squash-merge lineage proof

Obligation-ID: `github-terminalizer-squash-lineage-v1`  
Fingerprint: `github|terminalizer|squash-tree-equivalence-v1`

## Incident

PR #2415 passed Required, BRAIN, CodeQL and specialist gates and merged to main as `39bf2e30fef0674e68edbf91ba30f1ea6c2fe4b3`. The post-merge Obligation Terminalizer then failed in “Validate canonical merged lineage” because it assumed the candidate commit `86cec9e1cd0feba9a0d2ed9a835b6564997d9496` had to be an ancestor of the merge commit.

That assumption is invalid for a squash merge: GitHub creates a new commit. Merged-branch cleanup can also remove the branch ref before terminalization.

## Fix

The terminalizer now:
- explicitly fetches the candidate SHA;
- accepts direct ancestry when available;
- otherwise requires exact candidate-tree == merge-tree equivalence;
- still requires the merge SHA to be an ancestor of current `origin/main`;
- records `ancestor` or `squash_tree_equivalent` as the lineage proof mode;
- fails closed for every other state.

This preserves strict content containment while eliminating the squash-merge false negative.
