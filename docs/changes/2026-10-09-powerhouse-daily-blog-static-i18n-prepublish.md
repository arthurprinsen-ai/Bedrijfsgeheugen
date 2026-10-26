# Daily blog: close English static cache before admission

## Incident
2026-10-09 Powerhouse SOPV blog PR #4230 carried 23 raw Dutch source strings, but no English cache patch. The full Netlify build then generates 17 further translation fragments through SEO/site transformations. Required `preflight` failed with `STATIC_I18N_CACHE_INCOMPLETE`; subsequent website jobs were skipped. Publishing must not bypass this control.

## Canonical repair
- Keep one existing daily blog PR per Europe/Amsterdam business date.
- Reconcile the existing or newly created branch, never create a second writer for the same date.
- Replay the exact Netlify build transformations up to locale generation, then use the existing static locale compiler in dedicated `--prepare-cache=powerhouse-blog-YYYY-MM-DD.json` mode, translating missing strings through the configured Anthropic provider. Save only newly translated entries in `config/bg-static-i18n-en.d/`.
- Validate `--validate-cache` with `STATIC_I18N_REQUIRE_CACHE=1` before CI dispatch. If provider access or translation fails, preserve the open PR and retry in the next hourly reconciliation; no partial /en route and no false release status.
- Required CI runs the isolated provider-mock regression test before its current fail-closed cache validation; the existing protected merge and production readback remain authoritative.

## Evidence / limits
- Existing incident patch commit: `3965d6173b8ee706de9160c1aab22dd12569d42f`.
- Failing original CI: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37896426059
- Regression: `tests/brain-powerhouse-blog-i18n-prepublish.test.mjs` (provider mock; full cache validation; idempotence; blocked-without-provider; post-SEO extraction contract).
- A successful branch commit or green PR is not a public production readback. Exact-main Netlify deploy and public localized route must be checked independently.
- The workflow requires a configured `ANTHROPIC_API_KEY` only when new uncached text appears.
