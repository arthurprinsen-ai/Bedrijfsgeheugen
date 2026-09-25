# Development ledger — static i18n versioned cache v1

- Date: 2026-09-25
- Failure chain:
  - stale Netlify MCP proxy caused 401 Unauthorized;
  - proxy rotated in Supabase Vault;
  - GitHub OIDC bridge then returned HTTP 200;
  - linked Netlify build trigger returned ok=true;
  - production build still failed with build exit code 2;
  - deploy preview of the same source was green.
- Isolation: production static i18n networking is the material environment difference.
- Deterministic corpus: 94 public HTML files, 7,707 unique strings.
- Cache: 7,707 translations, zero missing, JSON roundtrip valid.
- Prevention: versioned cache + offline cache coverage validator + existing fail-closed English-production guards.
- Production authority: Production Source Snapshot is explicitly refreshed in this lineage.
- Terminal state: pending protected exact-head gates, merge, exact Netlify production identity and browser readback.

- Successor cleanup: remove duplicate `.cache` artifact, use only `data/i18n/`, and classify it as a website-shell contract in delivery governance.
- Follow-up: SEO money-page changes introduced 7 new translatable strings; added as canonical `data/i18n/bg-static-i18n-en.d/2026-09-25-money-pages.json`, merged deterministically and covered by offline cache validation. Public copy changes must carry translation coverage in the same candidate.
