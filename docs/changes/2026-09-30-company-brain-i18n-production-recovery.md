# Company Brain static i18n production recovery — 30 september 2026

## Root cause
De huidige main bevatte 11 Company Brain-tekstfragmenten die na de laatste website-/shelltransformatie afzonderlijk door de statische EN-build werden aangeboden. De fail-closed vertaalcache bevatte alleen enkele gecombineerde varianten en niet alle exacte fragmenten. Daardoor faalde de productiebuild met `STATIC_I18N_CACHE_INCOMPLETE`.

De fout werd zichtbaar toen de AI Modelwijzer Falcon-uitbreiding current main naar productie probeerde te brengen. De Falcon-wijziging zelf was niet de oorzaak.

## Fix
De 11 exacte Company Brain-fragmenten zijn toegevoegd aan `config/bg-static-i18n-en.d/20260930-company-brain-category-v1.json`. De fail-closed regel `STATIC_I18N_REQUIRE_CACHE` blijft volledig intact.

## Preventie
Publieke copy die door buildtransformaties kan worden opgesplitst moet voortaan op de uiteindelijke fragmenten door de premerge productie-buildparity worden gevalideerd. Een ontbrekende vertaling blijft een harde buildfout; de oplossing is de cache completeren, niet de gate versoepelen.

## Effect
Deze recovery maakt de huidige main opnieuw deploybaar en deblokkeert daarmee ook de reeds gemergede AI Modelwijzer-uitbreiding naar 110 modellen / 11 providers, inclusief TII/Falcon.
