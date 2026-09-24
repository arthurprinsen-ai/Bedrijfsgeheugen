# Netlify provider build fail-fast diagnostics — 24 September 2026

The GitHub OIDC bridge successfully authorized and submitted Netlify deploy `6ab523e2b70db132e952f681`, but Netlify marked that deploy `state=error`. The prior Production Source Snapshot then spent its entire exact-SHA readback window waiting for a release that could never become current.

The workflow now captures `deployId` and `buildId`, polls the provider deploy state first, and fails immediately when Netlify reports `error`. It prints only a bounded allowlist of diagnostic fields from deploy/build metadata. Credentials and the OIDC-returned proxy are never printed.

Exact production SHA and pricing/i18n browser proof remain mandatory after provider state becomes `ready`.
