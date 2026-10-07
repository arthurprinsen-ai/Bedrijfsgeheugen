# Repository Janitor retired-successor deadlock recovery v1

The repository Janitor no longer treats explicit provenance debris as an active terminal-delivery writer. Open pull requests marked `RETIRED`, `Retirement-State: RETIRED_DO_NOT_MERGE`, or with a `RETIRED:` body marker are excluded from the active-successor count.

A closed, unmerged terminal lease is no longer automatically reopened when a later pull request with the same Obligation-ID has already merged. Instead, the Janitor records `TERMINAL_LEASE_SATISFIED_BY_MERGED_SUCCESSOR` and continues cleanup.

Genuine ambiguity remains fail-closed: if more than one non-retired open successor exists for the same obligation, the Janitor still exits rather than choosing a writer.

This fixes the recurring deadlock that prevented stale GitHub Actions cleanup from reaching the cancel/force-cancel/delete-fallback stage.


## Transitive successor cleanup order

The first protected recovery (#4060) removed retired PRs from active-successor counting and correctly allowed merged successors to satisfy old terminal leases. Its production Janitor replay then exposed a second deterministic defect: the apply-safe plan could close a newer successor before an older predecessor had validated that successor.

Cleanup actions are now applied in ascending PR-number order. GitHub PR numbers are monotonic, so an explicit successor is newer than its predecessor. This preserves the existing fail-closed successor readback while making transitive chains such as A → B → C executable in one safe cleanup pass.
