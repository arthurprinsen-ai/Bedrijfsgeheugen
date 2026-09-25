# 2026-09-25 — Public copy / static i18n cache coupling

- Fingerprint: i18n-public-copy-cache-coupling-20260925-v1
- Current-main basis: 533dfca921111e42954657fd42f71806364f0b05.
- Observed: cache-only validation rapporteerde 126 ontbrekende translations na nieuwe homepage/AI-ecosysteemcopy.
- Recovery: versioned 126-entry patch onder config/bg-static-i18n-en.d/.
- Regression drift: oude tests verwachtten nog STATIC_I18N_NETWORK=1 of production runtime fallback; beide contracten zijn verwijderd.
- Prevention: public copy + English cache coverage is voortaan één atomair delivery-contract.
- Terminal: alleen exact Netlify SHA + pricing/NL-EN browserreadback mag LIVE_BEWEZEN opleveren.
