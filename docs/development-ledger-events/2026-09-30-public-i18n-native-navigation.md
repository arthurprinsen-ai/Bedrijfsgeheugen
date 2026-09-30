# Development ledger — public i18n native navigation

- Date: 2026-09-30
- Obligation: `public-i18n-native-navigation-20260930`
- Production symptom: pricing/English roundtrip timed out after exact Netlify production identity was already proven.
- Root cause: imperative public locale navigation plus unsafe nested `insertBefore` targeting in the i18n runtime.
- Fix: native public anchor navigation, capture-only preference persistence, parent-safe dynamic insertion, cache-busted i18n asset.
- Terminal proof required: exact production SHA + NL→EN→NL browser roundtrip on homepage, pricing and systems routes.
