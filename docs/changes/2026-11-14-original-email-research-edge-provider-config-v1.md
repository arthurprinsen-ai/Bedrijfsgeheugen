# 14 november 2026 — Oorspronkelijke e-mailbrononderzoeker ontbrak in Supabase-productieregistratie

## Onafhankelijk productiefeit
De oorspronkelijke protected merge [#5768](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5768) heeft nieuwe `powerhouse-relationship-public-research/index.ts` met concrete NO_SOURCE-ontvanger-ACK voor `prepared/waiting` in Git. Native Supabase migraties 856 en 857 zijn live; de originele #116-cron, originele ONE BRAIN/Heartbeat-ontvangst en brononderzoek zijn actief. **Maar** onafhankelijke productie-`get_edge_function` bleef **v13** en mist `researchNoSourceFeedback`.

## Oorzaak, correctie
`supabase/config.toml` verklaart de oorspronkelijke Edge-`powerhouse-mira-problem-radar` wél, maar de bestaande `powerhouse-relationship-public-research` **niet**. De officiële [Supabase GitHub Integration-documentatie](https://supabase.com/docs/guides/deployment/branching/github-integration) zegt dat alleen gedeclareerde Edge Functions vanaf protected main automatisch naar productie worden gedeployd als `Deploy to production` actief is.

Voeg uitsluitend deze reeds bestaande brononderzoekfunctie toe:
```toml
[functions.powerhouse-relationship-public-research]
enabled = true
verify_jwt = false
entrypoint = "./functions/powerhouse-relationship-public-research/index.ts"
```
`verify_jwt=false` sluit aan bij de bestaande v13-service-auth: de worker weigert elk verzoek zonder de originele geheime `x-powerhouse-token`. Dit geeft **geen** send authority; de functie is niet de Gmail-sender en doet zelf alleen bronnenonderzoek. De wijziging staat alleen in de eigen function-configsectie, zodat `resolveEdgeRuntimeFunctions` alleen deze ene bestaande Edge-aanpassing als productiescope herkent.

## Bewijs voor LIVE
1. Protected Required/BRAIN/CodeQL/hosted Supabase Preview, exacte main merge.
2. Supabase GitHub Integration (en niemand anders) deployt op dezelfde protected main-SHA. Onafhankelijk `get_edge_function` moet **nieuwe** provider-versie, lokale code/helper en de juiste auth tonen. Een groene GitHub PR of native DB-migratie is geen Edge-bewijs.
3. Oorspronkelijke cron #116, dezelfde echte DataForSEO-providerpoging en exacte e-mailontvanger-ACK blijven actief; geen vervroegde 24h-zoekpoging, geen ongevraagde/dubbele mails.
4. Originale #140 Heartbeat/ONE BRAIN blijft OPEN tot een actuele, rechtmatig verzonden Gmail-mail zelf met provider-ID en onafhankelijke recipient/inhoud-readback is bewezen.

Geen tweede cron, sender, queue of betaalde fallback; geen directe `mcp__Supabase__deploy_edge_function` of ongeautoriseerde break-glass. Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
