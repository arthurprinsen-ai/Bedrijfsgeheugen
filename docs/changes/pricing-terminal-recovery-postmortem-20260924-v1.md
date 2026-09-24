# Pricing terminal recovery — definitieve postmortem

## Eindstatus
De pricing/i18n-obligation `pricing-terminal-live-proof-20260924-v1` is terminal afgesloten via PR #2812.

Bewezen productie:
- feature merge: `a38f2cbab0d496b7d666ccc132244ba5bb0817c4`
- productie-SHA waarin de feature aantoonbaar aanwezig is: `4dacb0b86ad23999cbaa3abc90fa36810fca48b6`
- Netlify deploy: `6ab57a94c9e953d1209d82ff`
- provider state: `ready`
- context: `production`

## Fouten die niet opnieuw mogen gebeuren
1. Build-preservation slechts op één pricingsectie toepassen terwijl interactiecontrols over twee secties verdeeld zijn.
2. Persisted locale gebruiken als autoriteit voor een publieke route zonder taalprefix.
3. Noindex utility-routes verwarren met kapotte of indexeerbare routes.
4. Een naam/substringscheck gebruiken als vervanging voor controle op de concrete runtime-declaratie.
5. Een queued/pending CI-state behandelen als bewijs dat nieuwe code nodig is.
6. Merge, deploy-start of provider-ready verwarren met terminal gebruikersbewijs.
7. Material recovery openen zonder learning + ledger + human docs in dezelfde lineage.

## Permanente contracten
- Pricing build-integrity bewaart beide interactieve secties atomair.
- Public i18n gebruikt statische `/nl/*` en `/en/*` routes als autoriteit.
- Utility-routes worden apart geclassificeerd.
- Exact-head blijft immutable zolang alleen queue/capacity speelt.
- Terminal closure vereist provider identity plus browser-interactieproof.
- Een nieuwere productiecommit mag feature-live bewijzen via ancestry; exact-current-main vereist SHA-gelijkheid.

## Canonical regressions
- `tests/brain-pricing-runtime-build-preservation-v1.test.mjs`
- `tests/brain-public-i18n-static-route-authority-v1.test.mjs`
- `tests/brain-seo-login-noindex-scope-v1.test.mjs`
- productiecanary: `tools/site-shell/verify-pricing-i18n-production.mjs`

## Canonical learning
`brain/learning/pricing-terminal-recovery-postmortem-20260924-v1.json`
