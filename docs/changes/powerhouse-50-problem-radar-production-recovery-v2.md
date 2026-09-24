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

## Final exact-main refresh

The functional Netlify fallback is already live on production commit `bbb6ec5841eca4880d77ce0d09c6da458f7302b1`. The subsequent protected merge `9a9778d4284d7b1df491e0fffea7c3df3ac30167` contains closure learning/documentation only, so provider `commit_ref` is one main epoch behind.

This final recovery refreshes the existing canonical Production Source Snapshot once more. Completion still requires `ready + production + commit_ref == protected main`.

