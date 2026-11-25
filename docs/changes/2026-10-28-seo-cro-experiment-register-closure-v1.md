# CRO experiment-register closure (2026-10-28)

## Probleem
- Op 28 oktober 2026 had 0 van 222 rijen in `public.social_experiments` een `pagina` of `basislijn`.
- De dagelijkse SEO/CRO-lus voert wijzigingen uit, maar legt niet vast wat er veranderde, wanneer, en met welk verschil. Het portaal kan daardoor geen oud-versus-nieuw tonen en de lus kan niet van zichzelf leren.

## Wijziging
- `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`: nieuwe sectie "CRO experiment-register closure" (fingerprint `seo-cro-experiment-register-closure-v1`). Registratie na productiecontrole, één lopend experiment per pagina en meetpunt, controlegroep (verschil-in-verschil), autonome besluitregels en portaalweergave.
- `tests/brain-seo-conversion-orders-v1.test.mjs`: regressietest die de sectie vastlegt.
- Geen nieuw register, geen tweede scheduler.

## Open
- Het enforcement (poort die onder deze regels automatisch goedkeurt en besluit, nu achter een menselijk token) is een aparte migratie en wordt pas na productie-readback als gedaan gemarkeerd.
- De portaaltabel (gebied, wijziging, toegepast op, oude waarde, nieuwe waarde, verschil, zekerheid) is nog niet gebouwd.
