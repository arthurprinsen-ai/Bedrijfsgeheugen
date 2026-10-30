# Bestaande Powerhouse CRO — eventversheid is geen commerciële voltooiing
30 oktober 2026 · Original Growth/SEO CRO, ONE BRAIN/Heartbeat en Portal V2 · P0 #4198 / meetspoor #4446.

## Bewijs en oorzaak
Op de originele `powerhouse_cro_conversion_evidence_v1` waren bij controle rond 10:45 UTC 4.410 `is_robot=false` pagina-events in 7 dagen, maar geen vastgelegde CTA-events, formulierintenties, gekwalificeerde leads of onafhankelijk geverifieerde orders. `last_persisted_event_at` was 02:20:34 UTC en is de `occurred_at`-tijd van het laatst geregistreerde event; **niet** de ontvangst- of opslagtijd. De originele minuten-drain had 239 HTTP204-antwoorden in een vieruursvenster, wat alleen succesvolle uitvoering van de drain bewijst — niet dat nieuwe echte bezoekers of CTA's zijn opgeslagen. Zonder daadwerkelijk verkeer kan een lange stille periode normaal zijn. Ontbrekende gegevens zijn dus UNKNOWN, niet nul.

De bestaande admin-only CRO API selecteerde de juiste restricted view maar toonde de ouderdom van het laatste event niet naast de CTA-dekking. Daarmee bleef de foutklasse “technisch groen terwijl recente bronactiviteit niet bewezen is” onzichtbaar.

## Begrensde correctie
`projectCroEventRecency` gebruikt dezelfde originele view, vergelijkt de `evaluated_at`-versheid met `last_persisted_event_at` in een gegeven bronvenster en retourneert expliciete bewijsstatus:
- **<6 uur:** `RECENT_STORED_EVENT_OBSERVED`. Alleen een opgeslagen event met een recente gebeurtenistijd, géén systeem-/provider- of business proof.
- **6–24 uur:** `NO_RECENT_EVENT_EVIDENCE`. Onderzoek toegestane actuele siteactiviteit, geen defect of omzetverlies concluderen.
- **≥24 uur:** `EVENT_RECENCY_EVIDENCE_DUE`. Herstelverplichting binnen bestaande source-owner.
- **geen eventtijd / verouderde bron / toekomsttijd:** `NO_EVENT_TIME_RECORDED` of `UNVERIFIED`. Geen groen of nulimputatie.

Bestaande portaalpagina `Data & intelligence → Andere data` toont datum, tijd, leeftijd en oorzaak, inclusief het verschil tussen eventtijd, ACK en betaald resultaat. Nieuwe quality flag `CRO_EVENT_SOURCE_RECENCY_OR_READBACK_UNVERIFIED` activeert uitsluitend bewijsdiagnostiek; zij muteert geen bestaande 15-lussenstatus, contact, omzet of 7 CRO-verificatiegates.

## Één vervolgroute
Originele consented website-CTA → dezelfde Netlify `/api/growth-event` → duurzame queue ACK met echte event_id → bestaande growth-drain → Supabase `growth_events` ID/readback → `growth_page_daily` → werkelijke lead met doelbinding → contract/factuur + onafhankelijke betalingsprovider → ONE BRAIN toegepast leereffect → volgende natuurlijke Heartbeat-run. Geen synthetisch event, nieuwe cron, publisher, parallelle database, ongevraagde e-mail of versnelde publicatiedruk.

## Tests, veiligheid en release
`tests/brain-cro-event-recency-proof-20261030.test.mjs` toetst historisch, missing/future, stale bronsnapshot, recent/no-recent en commerciële false-green. Het bestaande Netlify Identity-admin/JWT-pad en tenantgrens blijven intact. `AGENTS.md`, twee bestaande skillbestanden, ONE BRAIN machine learning, menselijke doc, append-only development ledger en gegenereerde System Map horen bij dezelfde kandidaat. Alleen protected exact-head Required/BRAIN/CodeQL → squash merge → exact Netlify READY → ingelogde owner + niet-owner negatieve browserreadback → echte volgende natuurlijke toepassing legitimeert verdere status. Geen groeigarantie, want likes, views, clicks en orders bewegen niet gegarandeerd dagelijks omhoog.
