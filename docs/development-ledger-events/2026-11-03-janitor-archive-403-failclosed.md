# 2026-11-03 — Janitor archive 403 false-green prevention

- **Fingerprint:** `github|janitor-archive-sweep|tag-ref-create-403-masked-as-success|20261102-v1`.
- **Issue:** #5333, parent #5320; existing owner Powerhouse GitHub delivery Janitor.
- **Provider evidence:** original runs 41528932134 / 41546047078, 3 x HTTP403 on POST git/refs per run, 0 tags, 0 branches deleted, archive job success despite failed=3.
- **Root cause:** exception counted but nonzero result not propagated; workflow swallowed CLI failure. Effective GitHub tag creation permission policy still unproven.
- **Change:** typed minimal error event with SHA/phase/status, fail-close exit 78, original artifact always uploaded, safe branch retention, three-strike preserved.
- **Regression:** tests/brain-branch-archive-sweep.test.mjs (403, unknown error, native workflow status, branch deletion safety).
- **Brain:** brain/learning/2026-11-03-janitor-archive-403-truth-v1.json; original delivery self-optimization skill.
- **Open obligations:** 19 old closed terminal leases cannot be safely reopened from bounded history; four Actions ghost queued records remain server-side; supervisor drift unresolved. Distinguish all three from archive false green.
- **Release state:** Candidate on protected recovery branch, NOT live. Await Required, CodeQL, full BRAIN, protected merge, native Janitor fresh readback, canonical incident/portal reconciliation.
