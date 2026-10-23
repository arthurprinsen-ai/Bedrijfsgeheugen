# 2026-10-23 — Powerhouse dagelijkse blog: slug op 70-tekensgrens

- Canonieke bron: `supabase/functions/powerhouse-blog-export/index.ts`, bestaande Edge function `powerhouse-blog-export`.
- Werkelijke fout: [GitHub daily publisher #39883989350](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39883989350) faalde op `INVALID_SLUG`. Een 70-tekensafkapping liet een afsluitende `-` achter.
- Bronherstel: trim afsluitende koppeltekens na truncatie; bestaande goedgekeurde expliciete slug wordt niet stilzwijgend herschreven, maar afgewezen met 409 als die ongeldig is.
- Bewijslast: P0 [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439), bestaande publicatie- en lineagecontroles, één source-controlled regressietest. Geen alternatieve scheduler of dubbele blogverplichting.
- Livegang: alleen na Required, CodeQL, beschermd merge, exacte Supabase Edge-versie/source-readback, veilige controle op de GENERATED-verplichting en echte bestaande publicatie-executor plus publieke URL-verificatie. Een merged PR op zichzelf bewijst geen live Edge deployment of blogpublicatie.
