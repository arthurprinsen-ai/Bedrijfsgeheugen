# 10 november — native 821-provideridentiteit krijgt canonical Git lock-ACK

**Oorzaak:** originele native GitOps heeft na beschermde #5556 de nieuwe historische BRAIN-verwerkingsfunctie in productie toegevoegd (schema_migrations 820→821). De lock werd niet tegelijkertijd bijgewerkt; anders blokkeert de volgende originele SQL-release wegens 820 lock tegen 821 provider/source.

**Bewijs:** onafhankelijke Supabase `adhjwmvyoixzjtmiroln` readback `2026-11-10T09:28:59.623170Z` bevestigt 821 unieke toegepaste versies. Git `main` `147a8769208006091ed94cedc6e7b1803148ee37` heeft 821 SQL-bronnen, origineel `supabase/migration-history.lock.json` 820; eerste 820 namen en versies allemaal identiek met provider. Nieuw exact provider-ID `20261110123000_original_content_handoff_no_aging_gap_v2`. De nieuwe oorspronkelijke SQL-bron is onveranderd, blob `75e0b095eae1528474bc1e03fd0dc90182d240e7`.

**Herstel:** bronlock 820→821, verder geen SQL, cron, agent-executor, oude historie, providerstatistiek of publicatie. Enige vrijgave via originele protected Required + CodeQL + echte Hosted Supabase Preview. Pas gemerged melden na onafhankelijke provider/main-lock 821/821 match.

**Onderliggend leer- en omzetproces:** permanente per-datum/kanaal BRAIN-eigenaarsregistratie blijft actief; #171 heeft in productie no-aging-gap herinspectie (48 individuele learnings, 84 gecontroleerde postgevallen en 0 ongeregistreerde historische bronnen) bewezen. Na eerste rotatie drie aansluitende identieke checks met nul mutaties. 436 openstaande dossiers en 189 achterstallige leerverplichtingen zijn niet opgelost door een bronlockwijziging, blijven zichtbaar voor echte bronverwerking. Incident [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).
