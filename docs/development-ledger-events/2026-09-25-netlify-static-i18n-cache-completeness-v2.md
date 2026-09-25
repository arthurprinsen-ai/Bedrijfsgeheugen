# Development ledger — static i18n cache completeness v2

- Date: 2026-09-25
- Obligation: `netlify-static-i18n-cache-completeness-20260925-v2`
- Lane: website
- Candidate type: recovery
- Root cause: immutable English cache lagged exact website source by 1,926 strings.
- Recovery: generated cache in GitHub Actions with the configured translation secret, then offline-validated the completed cache.
- Safety: production translation remains network-disabled and fail-closed.
- Terminal requirement: protected merge -> exact-main Netlify deploy -> provider commit proof -> public readback of `/`, `/en/`, `/prijzen`, `/en/prijzen`.

- Follow-up fingerprint: `volatile-version-stamp-static-i18n-v1`.
- Preview evidence: Netlify deploy `6ab6965c7802a70008422a90` failed on exactly one generated string: `versie 25 sep, 17:45`.
- Prevention: build timestamps are operational metadata and are excluded from static/runtime translation via `data-bg-no-translate translate="no"`.
