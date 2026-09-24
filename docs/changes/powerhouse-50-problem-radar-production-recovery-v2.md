# 2026-09-24 — Netlify skipped linked-build fallback

Fingerprint: `powerhouse-50-problem-radar-production-recovery-v2`

## Incident

Production Source Snapshot triggered Netlify linked deploy `6ab57a396b0e16306cb97fee`.

Provider readback:
- state: `error`
- skipped: `true`
- error_message: `Skipped`
- context: `production`

That state means the Git-linked build route did not execute; it is not equivalent to a real provider build failure.

## Canonical fix

The existing Production Source Snapshot now:
- identifies `Skipped` explicitly;
- emits the machine-readable `linked_fallback="true"` marker;
- continues with the existing authorized exact-source upload transport;
- remains fail-closed for every non-skipped provider error.

No second deployment authority is introduced.

Regression: `tests/brain-netlify-linked-skipped-fallback-v1.test.mjs`.
