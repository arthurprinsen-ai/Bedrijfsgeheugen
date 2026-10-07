# Repository Janitor retired-successor deadlock recovery v1

The repository Janitor no longer treats explicit provenance debris as an active terminal-delivery writer. Open pull requests marked `RETIRED`, `Retirement-State: RETIRED_DO_NOT_MERGE`, or with a `RETIRED:` body marker are excluded from the active-successor count.

A closed, unmerged terminal lease is no longer automatically reopened when a later pull request with the same Obligation-ID has already merged. Instead, the Janitor records `TERMINAL_LEASE_SATISFIED_BY_MERGED_SUCCESSOR` and continues cleanup.

Genuine ambiguity remains fail-closed: if more than one non-retired open successor exists for the same obligation, the Janitor still exits rather than choosing a writer.

This fixes the recurring deadlock that prevented stale GitHub Actions cleanup from reaching the cancel/force-cancel/delete-fallback stage.
