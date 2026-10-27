# Skill: Powerhouse LinkedIn Company Growth

Fingerprint: `powerhouse-linkedin-company-growth-v1`

## Doel
Laat de LinkedIn-bedrijfspagina van Bedrijfsgeheugen structureel groeien binnen dezelfde Powerhouse Growth & Revenue OS. De bedrijfspagina is een zakelijke authority- en conversion-surface; bereik, paginaweergaven en volgers zijn tussenmetingen, geen einddoel.

## Canonieke identiteit
- Organisatie: `urn:li:organization:18234216`
- Kanaal: `linkedin_company`
- Runtime: `public.powerhouse_refresh_linkedin_company_growth_v1(date)`
- Dagstaat: `public.powerhouse_linkedin_company_growth_daily_v1`
- Pagina-analytics: `public.powerhouse_linkedin_company_page_metrics_v1`
- Policy: `public.powerhouse_linkedin_company_growth_policy_v1`
- Scheduler-owner: de bestaande `powerhouse_trigger_based_mkb_acquisition_cycle_v1`; er komt geen parallelle scheduler.

## Baseline en doel
De op 4 oktober 2026 geobserveerde LinkedIn-adminbaseline is 12 paginaweergaven in de getoonde periode: 10 desktop en 2 mobiel. De operationele eerste target is 300 paginaweergaven per 30 dagen en 100 relevante nieuwe volgers per 30 dagen.

## Dagelijkse closed loop
page analytics + company-post metrics -> gapdiagnose -> maximaal drie growth-aanbevelingen -> bestaande content-orchestrator/publicatieketen -> provider readback -> website/scan/lead/order/revenue outcome -> learning -> volgende diagnose.

## Contentregels
Bedrijfspaginacontent moet zelfstandig nuttig zijn voor MKB-directie/MT en minimaal één concrete waarde-eenheid leveren: checklist, benchmark, diagnostic, model, template, worked example of andere brongebonden toepassing. Een post krijgt één duidelijke reden om Bedrijfsgeheugen te volgen en, wanneer inhoudelijk passend, één route naar owned value zoals Bedrijfslek, Modelwijzer, benchmark of relevante kenniscontent.

## Kanaalscheiding
Gebruik het persoonlijke LinkedIn-profiel niet als commerciële traffic-bridge voor deze growth-engine. De bestaande persoonlijke kanaalregel blijft leidend: persoonlijk is alleen echte persoonlijke Arthur-context. Groei van de bedrijfspagina mag die identiteitsgrens niet afzwakken.

## Meten en leren
Meet page views, relevante volgers, impressions, reach, engagement en owned-site progression. Optimaliseer uiteindelijk op qualified leads, paid orders en realized revenue. Een stijging in volgers of views zonder downstream commerciële waarde is geen terminale winnaar.

## Guardrails
- geen dubbele of semantisch herhaalde posts;
- geen gefabriceerde social proof, urgency of benchmarks;
- source-backed business claims;
- maximaal één company post per dag vanuit deze growth-policy;
- maximaal drie growth-aanbevelingen per dag;
- provider/readback blijft verplicht;
- bestaand Growth Swarm/content/revenue-systeem wordt uitgebreid, niet gedupliceerd.
