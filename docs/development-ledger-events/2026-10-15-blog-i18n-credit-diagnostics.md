# Delivery ledger — blog i18n billing diagnostics

Business date: 2026-10-15. Obligation-ID: powerhouse-daily-blog-i18n-credit-diagnostics-20261015.

Provider evidence: GitHub Actions `Powerhouse daily blog from Supabase` run `38740677039`; `STATIC_I18N_PROVIDER_ERROR` HTTP 400; exact upstream message `Your credit balance is too low to access the Anthropic API.`

Remedy: bounded exact missing-cache-source-list diagnostics under the existing `PREPARE_CACHE_PATCH_NAME` switch, immediate terminal provider billing fail-fast, no translation quality/availability override, no recipient actions, no alternate model provider.

Acceptance pending: new GitHub Required + CodeQL and protected merge; then publisher workflow controlled retry and exact cache translation validation; no production article URL/readback claimed in this code change.
