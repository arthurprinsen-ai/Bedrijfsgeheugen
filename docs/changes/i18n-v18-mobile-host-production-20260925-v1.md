# Active v18 mobile language host — 25 September 2026

Production reached the exact protected commit, and the improved Playwright verifier opened the real mobile navigation. The browser evidence was decisive: `#v18MobileDrawer` was open (`aria-hidden=false`), but `v18Selects=0` and `allSelects=0`.

The runtime root cause was in `assets/js/i18n.js`. `mountControl()` knew about generic mobile roots and the older `#bgkopMob`, but not about the active `#v18MobileDrawer`. Therefore the runtime never mounted the language selector into the navigation customers actually use.

The recovery adds `#v18MobileDrawer` as a first-class mobile host while preserving the generic and legacy hosts. Regression coverage locks the runtime host and the production verifier to the same active drawer.

Terminal proof remains: protected merge, Netlify `commit_ref === main`, and successful visible mobile NL → EN → NL pricing roundtrip.

## Definitieve productieoorzaak

De uiteindelijke productie-readback liet zien dat `/prijzen` wel `assets/i18n.css` bevatte, maar niet `assets/js/i18n.js`. Daardoor werd de runtime voor taalwisselen helemaal niet geladen en bleef het aantal mobiele taalkeuzes op nul.

De diepere oorzaak zat in `tools/site-shell/apply-i18n.mjs`: één gedeelde `data-bg-i18n-asset` marker werd ten onrechte gebruikt als bewijs dat álle i18n-assets al aanwezig waren. Als alleen de CSS-link al bestond, stopte de transformer voordat het runtime-script en de mobiele taalcontrol konden worden aangevuld.

De permanente preventie is daarom:
- CSS en JavaScript onafhankelijk op aanwezigheid controleren;
- alleen ontbrekende assets injecteren;
- mobiele taalcontrol-injectie altijd idempotent uitvoeren na asset-reconciliatie;
- de actieve `#v18MobileDrawer`, generieke mobiele hosts en legacy `#bgkopMob` blijven ondersteunen;
- pas `LIVE_BEWEZEN` wanneer exact-main Netlify-identiteit én een zichtbare mobiele NL → EN → NL browserroundtrip groen zijn.

Deze regel is tevens geprojecteerd naar `powerhouse-continuity` en `powerhouse-netlify-production-truth`.
