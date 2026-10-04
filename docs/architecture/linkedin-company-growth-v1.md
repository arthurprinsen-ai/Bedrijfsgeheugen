# LinkedIn Company Growth — Powerhouse runtime contract v1

Bedrijfsgeheugen gebruikt één structurele growth-loop voor de LinkedIn-bedrijfspagina. De capability valt onder de bestaande Powerhouse Growth & Revenue OS en gebruikt geen aparte CRM-, content- of schedulinglaag.

De runtime leest de meest recente bedrijfspagina-analytics uit `powerhouse_linkedin_company_page_metrics_v1` en combineert die met bestaande company-postdata uit `social_posts` en `social_metric_snapshots`. De functie `powerhouse_refresh_linkedin_company_growth_v1(date)` berekent de distributiegap en schrijft maximaal drie idempotente aanbevelingen naar `powerhouse_content_recommendations`.

De capability draait vanuit de bestaande `powerhouse_trigger_based_mkb_acquisition_cycle_v1`. Publicatie blijft eigendom van de bestaande content-orchestrator/social publisher, inclusief source-backed truth, semantic dedupe, identity gate en provider readback.

De bedrijfspagina heeft als eerste operationele target 300 paginaweergaven per 30 dagen en 100 relevante nieuwe volgers per 30 dagen. Deze waarden zijn intermediate growth signals. De commerciële evaluatie blijft: owned-site progression, qualified lead, paid order en realized revenue.

Het persoonlijke LinkedIn-profiel is geen commerciële fallback of traffic-bridge. De bestaande personal-life-only identiteit blijft intact.
