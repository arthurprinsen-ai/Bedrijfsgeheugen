# Development ledger — protected admission error annotations

- Date: 2026-10-08
- Obligation ID: one-brain-config-watch-notification-20261008-v1
- Trigger: Configuratiewacht run #37790182998 failed despite parseable Netlify redirects and sitemap, because protected admission had an unannotated `exit 1`.
- Root cause: the new material/learning fail-closed workflow lacked actionable GitHub annotations, causing a false message that the site configuration could not build.
- Correction: preserve all failure exits and existing security gates, add `::error::` annotations with reason on every explicit failing admission path.
- Changed artifacts: `.github/workflows/powerhouse-delivery-hygiene.yml`, `tests/brain-protected-integration-closure-v1.test.mjs`, `brain/learning/2026-10-08-config-watch-admission-error-annotations-v1.json`, `docs/changes/2026-10-08-config-watch-admission-error-annotations-v1.md`, this ledger.
- Verification: RED→GREEN regression plus Python configuration-watcher direct readback. Protected merge, fresh post-merge watcher, Netlify exact SHA readback and closure of issue #4162 remain separate steps.
- Unrelated external messages and AI provider activation: not performed.
