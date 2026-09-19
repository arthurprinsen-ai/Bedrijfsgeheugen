# GitHub queue amplification guard

- Date: 2026-09-19
- Type: IMPROVEMENT / RESOURCE_SAVING
- Fingerprint: `github|queue-amplification|path-scope-and-push-scope|v1`
- Signal: 160 queued GitHub Actions runs while 20 were in progress.
- Root cause: global recovery ran on every branch push; Revenue Learning and LinkedIn Revenue Cockpit reacted to unrelated Supabase migrations.
- Fix: recovery supervisor push scope = main only; LinkedIn migration triggers narrowed to owned migrations; generic migration-history checks moved into the existing Supabase preview lane; Revenue Learning no longer fans out on every migration.
- Safety: schedule/manual recovery remain; pull-request Required/BRAIN paths remain; migration-history integrity remains fail-closed in Supabase preview.
- Regression: `tests/brain-github-queue-amplification-guard-v1.test.mjs`.
- Expected resource effect: fewer workflow creations, runner reservations, dependency installs and duplicate tests per unrelated change.
- Production status: pending exact-head gates, protected merge and main readback.
