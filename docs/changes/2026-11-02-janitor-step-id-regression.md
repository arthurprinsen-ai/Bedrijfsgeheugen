# Original Janitor: regression must follow stable step IDs — 2 November 2026

Canonical scope: one original `Powerhouse Repository Janitor` and original ONE BRAIN/Heartbeat. GitHub source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41518702294. Exact failed original backend job #125529347516, source main `eaf74c91a932964792ae84716e2157980b459ab7`.

## Proven root cause
Five Janitor regression tests failed on `Input: ''`. The tests extracted YAML sections using `- name:`, while the protected original workflow now declares `- id: janitor_cleanup_reconcile` and `- id: janitor_cleanup_readback` before the exact same names. These tests therefore saw zero-length sections. The actual workflow contains bounded pages, fresh live GitHub head/status checks, guarded terminal reopen and independent readback, and earlier separate original cleanup was successful; this is not new proof of runtime success.

## Source-only preventive correction
Patch the two original regression tests to anchor by exact unique `- id:`, require exact following human name and ordered nonempty original sections, and run every previous assert *unchanged*. Fail closed when a step disappears or ordering changes; do not weaken any original test or edit `.github/workflows/powerhouse-repository-janitor.yml`. Update existing ONE BRAIN learning, two skills, AGENTS and original incident fingerprint `github|brain-janitor|source-step-id-breaks-name-only-regression-fixture|20261102-v1` with root cause and test proof.

## Acceptance and remaining limitations
Protect original Required/CodeQL and FULL BRAIN, then merge with the original protected writer and independently check native Janitor and same-run agent artifact. A passing unit test never makes the native Janitor, Supabase runtime faults, private calibration, cost receipts, publication channels or customer outcomes green. Preserve issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5320 and existing native scheduler. No credential workarounds, hidden retries or parallel executor.
