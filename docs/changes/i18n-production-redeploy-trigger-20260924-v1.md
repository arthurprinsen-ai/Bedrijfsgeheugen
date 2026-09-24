# I18n production redeploy trigger — 24 September 2026

A documentation-only merge did not start the canonical production deployment because `Production Source Snapshot` is intentionally path-filtered to `.github/workflows/production-source-snapshot.yml`.

The correct terminal deployment trigger is therefore an operational refresh to that workflow file. This preserves the authorized Netlify transport, exact SHA readback and production browser proof.

Netlify production build scope now also pins `STATIC_I18N_CONCURRENCY=1`, matching the provider-friendly pacing contract already present on main.
