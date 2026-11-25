# Branch Reconciler v4

Obligation-ID: ci-branch-reconciler-v4-20261026
PR: #4961

Moves opt-in branch synchronization from a late Janitor step into an independently scheduled job of the existing Janitor workflow. Preserves SHA compare-and-swap, excludes drafts and forks, classifies API failures, verifies readback of a new head and zero missing base commits. Does not add a workflow or bypass protected merge. CI and production proof remain pending until provider readback.
