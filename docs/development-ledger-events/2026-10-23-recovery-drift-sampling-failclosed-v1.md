# Same-lineage recovery completeness evidence — 2026-10-23
Canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120
Observed provider: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39966378899
First protected metrics artifact: 12506997591, event_rows=0, circuit not open, recovery budget exhausted (one Required dispatch).
Root cause: successful supervisor run did not establish the number of all eligible PRs, yet reducer claimed complete source snapshot.
Fix: mark scan coverage partial/unproven and denominators null in the same existing metrics module; add negative tests, preserve all security controls.
Acceptance: exact-head Required/CodeQL, protected merge, postmerge module readback and subsequent artifact; never infer full coverage or customer outcomes.
