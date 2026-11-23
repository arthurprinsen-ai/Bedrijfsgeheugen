# 4 november 2026 — persoonlijke LinkedIn-bronrotatie ziet oude geverifieerde verhalen niet

## Onafhankelijk gevonden oorzaak
Tijdens de echte oorspronkelijke content-loop na het geplande publicatiemoment, request #20538, werd LinkedIn Bedrijf wél `LIVE_PROVEN` maar LinkedIn Persoonlijk afgekeurd: `GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE`, eerdere bronclaim van **27 oktober 2026**. Er is geen persoonlijke provider-side-effect aangemaakt en geen provider-ID. De originele bronrotatie zoekt echter uitsluitend 7 eerdere dagen; 27 oktober ligt 8 dagen vóór 4 november en valt buiten het bereik. Extra fout: zowel bronreserve als bronselectie lezen eerdere eventtypen uit `evidence.result_event` bovenin de historische post. In werkelijkheid staan ze onder `evidence.identity_gate_evidence`. Op 27 oktober en 4 november delen de werkelijke geverifieerde gebeurtenissen `commercial_heartbeat` en `source_health_evaluated`. De oorspronkelijke generator zag die botsing dus niet, terwijl de wereldwijde publicatiebeveiliging deze terecht tegenhield.

## Herstel met dezelfde eigenaar
Dezelfde oorspronkelijke `powerhouse-content-orchestrator` gebruikt voortaan een bronhistorie van **30 dagen**, én een gedeelde `personalSourceEventTypes`-functie die top-level én werkelijk aanwezige geneste brongegevens van reeds gepubliceerde posts leest, dedupliceert en ook bestaande dubbelgecodeerde JSONB bewijzen begrijpt. Een eerder gebruikt gebeurtenistype telt nooit als nieuw verhaal alleen omdat de bron of dag-ID gewijzigd is. Geen tweede publisher, geen nieuwe cron en geen uitgeschakelde LinkedIn-uniquenesscontrole.

## Menselijke en machinale kwaliteitsborging
Regressie `tests/brain-personal-verified-history-duplicate-rotation-20261104.test.mjs` replayt de echte gepubliceerde oktobergebeurtenissen en test onderscheidende verse bronvarianten, ook nested/JSON. ONE BRAIN leersleutel `brain/learning/2026-11-04-personal-verified-history-duplicate-rotation-v1.json` met historische replay, shadow, canary. Original social recovery agent skill plus activity log geactualiseerd.

Alleen beschermd Required/BRAIN/CodeQL/Supabase Preview, merge en daadwerkelijke oorspronkelijke Edge source-parity maken de codefix live. Alleen nieuw geredigeerd, aantoonbaar verschillend en daadwerkelijk door provider bevestigd LinkedIn-bericht met onafhankelijke ID/URL maakt de persoonlijke dagpublicatie groen. Geen automatisch hergebruik van Oct27, geen verzonnen bron, geen extra OpenAI-verzendpad.

Incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Activity ledger
- 2026-11-04 07:01Z original authorized daily publisher verdict: `GLOBAL_POST_DUPLICATE_BLOCKED`, matched 2026-10-27; no provider create.
- Investigation: nested original evidence published Oct27 shares commercial_heartbeat and source_health_evaluated with today, but original seven-day flat-top reader did not see it.
- Own original code repair + deterministic regression, strict live proof only; no status force or provider side-effect replay.
