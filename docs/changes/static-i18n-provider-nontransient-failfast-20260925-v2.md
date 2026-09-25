# Static i18n provider fail-fast — 25 september 2026

PR #2707 contained two concerns. Its temporary Netlify credential recovery is obsolete because current main uses GitHub OIDC and the Netlify deploy bridge. The still-valid defect was provider retry behavior.

The localized-route builder now classifies credit exhaustion and invalid auth explicitly and throws immediately for non-transient provider failures. Only rate limits and 5xx classes retry. This prevents recursive batch splitting from amplifying a known account-level failure.
