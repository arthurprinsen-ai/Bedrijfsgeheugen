# Veiligere AI-innovatiebenchmark: geen upgradeadvies op onmogelijke cijfers

Canonieke engineering-eigenaar [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). Bestaande kwaliteitsbron `scripts/brain/quality/innovation-benchmark.mjs`; aangrenzende actieve innovatiepoort [#4763](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4763) blijft de eigen schrijver van zijn andere bestanden.

## Oorzaak
De comparator keek uitsluitend of zes dimensies aanwezig waren, niet of zij valide waren. JavaScript laat negatieve kosten/looptijden en reproduceerbaarheid boven 100% door gewone vergelijkingsoperatoren gunstig uitvallen. Ook een `security_fit=false` baseline kon voor een kandidaat een `ADOPT`-advies opleveren zonder goedgekeurde veiligheidsvergelijking.

## Bounded reparatie
Voor **beide** benchmarkrecords gelden getypeerde eindige niet-negatieve numerieke metingen, `false_positive_rate` en `reproducibility` binnen [0,1], en expliciete booleaanse `security_fit`. Een afgekeurde incumbent-baseline levert `INSUFFICIENT_EVIDENCE`; een onveilige kandidaat `REJECT`. Geldige datasets behouden de bestaande zesdimensievergelijking. Elk resultaat krijgt `promotion_authorized:false` en `benchmark_advisory_only:true`. De bestaande technologieverkenner, Quality-workflow, Brain, agenten en CI blijven eigenaar; **geen tweede scheduler of automatisch modelwisselbesluit**.

## Vereist bewijs
`node --test tests/brain-innovation-benchmark-evidence-integrity-v1.test.mjs`, daarna exact-head GitHub admission, Required en CodeQL, beveiligde merge, main/source-readback en bestaande Skill Projection. Vergelijkbare onafhankelijke cohorts, voldoende samples, tenant/RLS, beveiliging, leverancierautorisatie, kosten, shadow/canary en klantuitkomst blijven afzonderlijke promotie-eisen. Geen performance- of modelverbetering claimen uit synthetische regressietests.
