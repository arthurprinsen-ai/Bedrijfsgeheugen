# 25 oktober 2026 — herstel onafhankelijke commerciële publicatiebewijs-reconciliatie

**Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
**Obligation:** growth:daily-publication-proof-lost-on-decision-write:20261025-v1  
**Fingerprint:** powerhouse|commercial-daily|canonical-live-blog-evidence-not-counted|20261025-v1  
**Scope:** bestaande productie-Supabase functie `powerhouse_execution_status(date)` en bestaande Required-tests.

## Productiebewijs

De commerciële dagregistratie voor 25-10 bleef degraded, ondanks:
- Blog: `content_publication_obligations` LIVE_PROVEN, exacte canonical URL, onafhankelijk proof `provider_truth_verified=true`, live vanaf 10:02:54 UTC.
- LinkedIn bedrijfspagina: LIVE_PROVEN met exact provider share-ID en onafhankelijke readback.
- LinkedIn persoonlijk: PUBLISHED met definitief provider-create ACK, `readback_permission_limited=true`, `republish_forbidden=true`. Geen onafhankelijke provider-readback; publicatie wordt nooit nogmaals aangemaakt.
- Instagram: echt BLOCKED (`MEDIA_ASSET_REQUIRED`), ontbrekende media en identiteitsbewijs; status mag niet groen worden.
- Predictieve keten: 977 te laat staande FORECAST_CALIBRATION-verplichtingen, laatste meting 15 oktober.
- Gmail bron: laatste readback 20 oktober, `coverage_state=stale`, blokkeert volledige proof.

## Vastgestelde oorzaak

`powerhouse_execution_status` las alleen `powerhouse_channel_decisions.delivery_evidence`. Voor de blog was `state=published` en `delivery_ref` de juiste HTTPS-URL, maar de top-level provider_truthvelden ontbraken, hoewel exact dezelfde inhoud in de bestaande publicatie-autoriteit LIVE_PROVEN was. Daardoor bleef een werkelijk bewezen providerresultaat ten onrechte `unresolved_publish`. Ook de persoonlijke LinkedIn-publicatie werd onopgelost geteld ondanks een immutable provider-create ACK, terwijl readback technisch 403 Forbidden is.

## Correctie

De bestaande read-only `powerhouse_execution_status(date)` gebruikt uitsluitend:
- `tenant_id='canonical'`, exacte datum en kanaal.
- Exacte `delivery_ref` gelijk aan `external_id` of canonical URL.
- LIVE_PROVEN met onafhankelijke provider_truth + daadwerkelijke `live_proven_at`.
- OF afzonderlijk PUBLISHED + onwrikbaar provider-create bewijs + ACK + permissiebeperking + `republish_forbidden`. Dit telt alleen als **terminal side effect**, niet als onafhankelijke readback.
- Onbekend/NULL faalt gesloten en wordt geen succes. Alleen echte `decision='publish'` met een terminale state wordt meegerekend.
- Blokkades zoals Instagram, Gmail-staleness en achterstallige prognoses blijven onaangetast. De bestaande `powerhouse_daily_execution_guard` eist ook `publication_proof_health`, `predictive_health` en `autonomy`; de volledige dag kan dus niet kunstmatig groen worden.

Geen scheduler, agent, queue, provider-send, CRM- of datamodelwijziging. Het bestaande single-writer productie/release-proces blijft verplicht.

## Verificatie

Een onafhankelijke **read-only productierun** over de bestaande dagdata gaf exact:
- Blog `independent_provider_proof=true`.
- LinkedIn bedrijf `independent_provider_proof=true`.
- LinkedIn persoon `independent_provider_proof=false`, `limited_provider_ack=true`.
- Instagram geen bewijs.

Required test: `tests/brain-commercial-daily-provider-proof-reconciliation-20261025.test.mjs`. Voor productie blijven noodzakelijk: exact-head Required/CodeQL/Supabase Preview waar vereist → protected merge → migratiehistorie/prod readback → een echte volgende bestaande Heartbeat-run → de aparte resterende media, Gmail, forecast en order-evidence herstellen. De status van deze correctie is CANDIDATE_NOT_LIVE zolang de keten niet onafhankelijk is geverifieerd.
