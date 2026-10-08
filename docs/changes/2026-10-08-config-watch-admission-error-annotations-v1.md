# Configuratiewacht: actionable protected-admission errors — 8 October 2026

**Obligation:** `one-brain-config-watch-notification-20261008-v1`.
**Authoritative control:** the existing GitHub protected `hygiene / admission` workflow and its admission evidence; no new watcher or reporting database.

## Root cause

After PR #4163 merged, the configuration watcher correctly identified an avoidable observability gap: `powerhouse-delivery-hygiene.yml` contained explicit `exit 1` failure paths but did not surface a GitHub `::error::` annotation. The configuration watcher consequently failed on main, although Netlify's deployed config was parseable and the site was serving its last published version. The existing workflow's actual admission, canonical learning and material closure fail-closed checks remain required.

## Change

Annotate the concrete admission-evidence-missing, learning-canonicalization-failed, and material-integration-closure-failed paths in that same workflow, with actionable reason codes and existing immutable artifact context. Do not remove any `exit 1`, branch protection, learning check, or integration-closure guard.

## Evidence and acceptance

A new regression in `tests/brain-protected-integration-closure-v1.test.mjs` first reproduced the configuration watcher failure, then confirmed that its report and the regression are green. The full configuration parser checked `netlify.toml`, `_redirects`, `sitemap.xml` and all potentially failing workflow notifications. Production release and provider-delivery evidence must still be read back separately; this is not proof of external messages being sent.
