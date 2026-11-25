# Website/CRO observability — canoniek meet- en experimentcontract (29 oktober 2026)

**Scope:** bedrijfsgeheugen.nl / bestaande Supabase `public.bg_interacties`, `bg-interactie`, `bg-meetoverzicht`, `bg-experimentcyclus`, Powerhouse + Brain, beveiligde `/intern/meetoverzicht/` en Portal V2 `Andere data`. Dit is **geen** nieuwe executor, scheduler, CRM, of los experimentregister.

## Actuele gecontroleerde nulmeting (2026-10-29, database-read)

- In `growth_events` stonden 222.752 rijen en was de meest recente waarneming 2026-10-29 16:18 UTC.
- In `powerhouse_experiment_assignments` stond 1 toewijzing, laatst 2026-10-02.
- In de laatste 24 uur: website 34.859 robot-geclassificeerde events (565 sessies), website 101 mens-geclassificeerde events (46 sessies) en portaal 124 robot-geclassificeerde events (62 sessies).
- Dit zijn events/sessies, **niet** unieke menselijke bezoekers, orders of bewezen conversies. De classificatie kan onjuist zijn en vereist controle.
- Voorheen antwoordde `bg-interactie` bij databasefout met HTTP 202 / `ok:true` / `opgeslagen:0`, terwijl de browser zijn batch al had gewist. Root cause: geen end-to-end opslag-ACK en geen idempotente replay.
- Nieuwe events kunnen pas als live worden beschouwd nadat database-migratie → Edge ingest → assets → beveiligd portaal → brondata → experimentreadback onafhankelijk zijn bewezen.

## Datacontract (geen ingevoerde waarden)

| Dimensie | Event of afleiding | Definitie | Interpretatie |
| --- | --- | --- | --- |
| Pagina | `pagina` | pagina-oproep, zonder querystring | Niet gelijk aan unieke bezoeker |
| Scrollbereik | `scroll` 10/25/50/75/90/100 | bereikte diepte per sessie/pagina | Niet gelijk aan gelezen content |
| Laatste zichtbare sectie | `sectie_zichtbaar` + `pagina_verlaten.onderdeel` | laatst in viewport geregistreerde semantische sectie | Exit kan worden gemist; schatting, geen exacte oorzaak |
| Vertrekdiepte | `pagina_verlaten.diepte_pct` | laatst gemeten maximale scroll | Browser kan `pagehide` overslaan |
| Klik | `klik`, `whatsapp_klik` | expliciet aangeklikte CTA / contact | Klik ≠ gesprek of order |
| Frictie | `frustratie_klik` | ≥ 3 snelle klikken op hetzelfde expliciet benoemde element | Heuristiek; nooit definitief 'dead click' |
| Formulier | `formulier_start`, `formulier_fout`, `formulier_verlaten`, `formulier_verzonden` | starts, validatiefout, uitval, submit | Submit ≠ geverifieerde lead |
| Popup | `popup_getoond/gesloten/conversie` | UI moet expliciet een `bg:cro-popup` event sturen | Niet automatisch aannemen dat popup bestaat |
| Experiment | `experiment_blootstelling` | UI stuurt `bg:cro-exposure` na echte behandeling, arm control/treatment | Geen exposure zonder autoritatieve assignment |
| Omzet | bestaand outcome-register | provider-gevalideerde order + bedrag | Geen conversie als omzet presenteren |

De huidige event-schema-velden `pad`, `onderdeel`, `element_tekst`, `element_doel`, `diepte_pct`, `seconden`, `bron_domein`, `herkomst`, `apparaat`, `is_robot` en `toestemming` blijven de bestaande opslagroute. `event_uid` is uitsluitend een willekeurige event-ID voor veilige retries.

## Privacy & datakwaliteit (harde gates)

1. Uitgebreide gedrags- en experimentmetingen alleen bij aantoonbare toestemming; GPC/DNT blokkeren de bestaande client. Functionele en beperkte analytische metingen vereisen een afzonderlijke privacytoets. Geen sessiereplay, ingevulde velden, e-mail, telefoonnummer, IP, user-agent of URL-querystrings opslaan.
2. Ingest bevestigt een batch alleen na succesvolle database-write/readback; bij 503/degraded geen bevestiging. Browser wist de queue pas na exact ACK. Beperkte sessionStorage-queue en bounded exponential backoff; risico op verlies bij tabbladsluiting blijft als onopgeloste meetbeperking zichtbaar.
3. `event_uid` uniek in Supabase; nieuwe migratie vóór producer/Edge release. Dubbele retries mogen niet leiden tot dubbele events.
4. Botverkeer en interne tests gescheiden van menselijke data. Elke CRO-resultaatstaat toont menselijke sessies, consent/dekking, databron, versheid, teller/noemer en definitie. Geen `n=0` als onbekend of ontbrekend.
5. Beveiligde tenant-/beheerdersgrens blijft ongewijzigd. Portal `Andere data` toont het **bestaande code-beveiligde** interne Meetoverzicht; er komt geen publieke data-endpoint bij.
6. `pagehide`/visibility zijn onvolledig; niet iedere uitstap kan waargenomen worden. Een exit-map mag alleen uit daadwerkelijk waargenomen gebeurtenissen worden afgeleid.

## Experimentprotocol dat alle bestaande CRO-agents volgen

Per hypothese verplicht: owner, trigger/kans, concrete gebruikersfrictie, pagina/segment, control, behandeling, exposure-criterium, primaire conversie, secundaire metrics, kosten, resultaatdefinitie (lead/order/revenue), guardrails (performance, errorrate, privacy, bounce), start/stop, minimaal zinvolle steekproef, randomisatie-eenheid, sample-ratio-mismatch, praktische effectgrootte en onzekerheidsinterval. Besluit: WON / LOST / INCONCLUSIVE / INVALID, met bewijslinks en Brain-leerrecord.

**Niet doen:** automatisch winst claimen bij statistisch onvoldoende verkeer; peeking/stoppen zodra p<0,05 zonder vooraf vastgesteld stopprotocol; experimenten overlappend aan dezelfde gebruiker zonder collision-guard; fake omzet/gesprekken; donkere patronen of hinderlijke popups.

Prioriteit bij weinig menselijk verkeer: eerst betrouwbare instrumentatie en grotere, betekenisvolle wijzigingen (propositie, formulierfrictie, contactkeuze). Alleen uitgevoerde experimenten verschijnen als `RUNNING`; voorgestelde experimenten zijn `PROPOSED`.

## Continue gesloten lus binnen de bestaande executor

Website-event → ingestbevestiging → bot-/consent-/kwaliteit-filter → geaggregeerde pagina/trechter/variantdata → agent-hypothese → geautoriseerde versiebeheerwijziging → Required/CI → productie-readback → onafhankelijke lead/order outcome → Brain-leerrecord → nieuwe prioritering. Als noodzakelijke meetdata ontbreken: markeer `DATA_GAP`, leg eigenaar en incident vast, maak veilige instrumentatie-PR, controleer effect na release. Geen tweede scheduler.

## Externe, controleerbare referenties

- Google Analytics events: https://developers.google.com/analytics/devguides/collection/ga4/events
- Google Analytics recommended events: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Microsoft Clarity scroll/drop-off maps: https://learn.microsoft.com/en-us/clarity/heatmaps/scroll-maps
- Microsoft Clarity click maps (dead/rage/error/last): https://learn.microsoft.com/en-us/clarity/heatmaps/click-maps
- Microsoft Clarity consent: https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-management
- Autoriteit Persoonsgegevens, analytische vs. trackingcookies: https://autoriteitpersoonsgegevens.nl/nl/onderwerpen/internet-telefoon-tv-en-post/cookies

## Portal Andere data (onderdeel van bestaande PR #5140; reparatie in #5144)

Het canonieke dashboard blijft `portal-v2/modules/andere-data.js` en de eigenaar-API `/api/powerhouse-cro-other-data`. Het presenteert de bestaande CRO-experimenten en het geaggregeerde gedrag uit `bg_cro_behavior_daily_v1`: sectie waar het laatste zichtbare signaal is waargenomen, exit-capture, laatste scroll onder 25%, form-uitval, fouten, WhatsApp-intentie, herhaalklik-heuristiek, popup- en experimentblootstellingen. Alleen beheerders zien dit; geen ruwe formulieren, logs of sessieafspeelgegevens.

De serverprojectie rapporteert `persisted_event_receipts` en `historical_without_receipt` apart. Bij een ontbrekend event-UID-bewijs blijft de flag `NEW_EVENT_UID_READBACK_NOT_YET_VERIFIED` actief. `status=LIVE` van een REST-bron betekent alleen bereikbare bron, niet bewezen conversies of volledige eventcapture. De interne rapportage is leesbaar voor agenten binnen de bestaande service-role governance; pas na exacte readback mogen nieuwe meetvelden experimentbesluiten onderbouwen.

PR #5144 is afhankelijk van PR #5140, niet parallel te mergen. Publicatievolgorde: #5140 beschermen en mergen → #5144 herconcilieren naar nieuwe main → UID- en viewmigraties → Edge-functie → website met asset-cachebust `v=5` → portaal → browser+DB-readback. De System Map-regenerator en alle Required/CodeQL/BRAIN-voorwaarden blijven verplicht.

## Release & readback

1. Apply additive SQL migration through protected database release. Check unique event UID index and previous data counts.
2. Deploy `bg-interactie` Edge code. Test wrong-origin, no-consent detail rejection, db-degraded=503, duplicate UID idempotency, ACK mismatch.
3. Release `assets/meting.js`; simulate reload, network failure, 503→200, retry, form invalid, click, scroll, click spam, popup exposure, and no-consent.
4. Release portal. Verify `?page=andere-data` is unavailable when unauthenticated and loads the existing internal code-gated report when authenticated.
5. Reconcile latest persisted data and actual experiment inputs before agents may use new events to decide actions.
6. No `LIVE` / `GREEN` without GitHub main SHA, Netlify deploy SHA, Supabase function version, database readback, portal browser proof and first genuine human events.

## Permanent incident- en leereffect #5141

De canonieke foutfingerprint is `site|bg-interactie|dequeue-before-durable-ack|overflow-and-duplicate-cta|20261029`. De Brain-regel `brain/learning/2026-10-29-cro-raw-ack-5141-v1.json` en menselijke ledger `docs/development-ledger-events/2026-10-29-cro-raw-ack-5141.md` bevatten oorzaak, eigenaar, test en preventie. Bij een volledig gevulde browserbuffer behouden we de **oudste onbevestigde** events; nieuwe gebeurtenissen kunnen uitvallen en worden lokaal geteld onder `bg_meting_queue_overflow_v1`. Dit is géén centraal bevestigd dekkingscijfer: zolang er overloop is of pagehide-events ontbreken blijft meting onvolledig. Op gegenereerde money pages mag `meting.js` commerciële CTA's/form-events niet dupliceren wanneer `bg-growth-measurement` aanwezig is. Alleen klikken binnen `<main>` zijn kandidaat voor de sitewide primaire CTA-bridge. Controleer dit bij iedere toekomstige generator-, meet-, consent- of portaalwijziging met een regressietest. De oplevering blijft niet-live totdat UID, opslag, consent, tenantgrenzen en releasedeploy onafhankelijk zijn gelezen.
