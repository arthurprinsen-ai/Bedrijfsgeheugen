# Netlify deploy auth expiry — 24 September 2026

Production Source Snapshot run `35974869594` reached the authorized Netlify fallback and failed with `401 Unauthorized`.

This was not an i18n build failure. It was an expired or invalid `NETLIFY_MCP_PROXY_PATH_TEMP` credential in GitHub Actions.

Prevention:
- classify the exact failed production step before changing application code;
- reach the fallback sooner by reducing the passive Git-linked wait;
- treat Netlify 401 as authentication, not build failure;
- never call production live until exact identity and browser proof pass.

The GitHub connector used by ChatGPT does not expose Actions-secret writes, so rotating the secret remains an account-level credential action.
