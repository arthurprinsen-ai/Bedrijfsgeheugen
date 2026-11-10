# 9 november 2026 — originele commerciële onderzoeks- en verzendketen

- **Obligation:** `commercial|research-composer-handoff|20261109-v1`
- **Verifieerbare productiestatus:** canonical outreach cron 112/113/114 en commercial stage cron 116 slagen; Gmail preflight slaagt. Beide originele e-mails op `prepared`, nul provider-acknowledged verzendingen in de vorige 30 dagen. Eén originele brononderzoekstaak heeft een goedgekeurd bedrijfsspecifiek nieuwsrecord; één blijft zonder bewezen bron wachten.
- **Oorzaak:** composer gebruikt het inmiddels voltooide brononderzoek van dezelfde action-ID niet en herhaalt `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`. De interne researchstatus `done` is nooit een extern resultaat.
- **Owner:** originele `powerhouse-commercial-message-composer`, aanvoer door dezelfde `relationship-research:outreach-source:<action-id>`-research.
- **Reparatie:** de in-memory composercontext wordt uitsluitend gevoed uit sluitende research+canoniek goedgekeurd nieuws (identiteit, URL, tijdvenster, confidence) en doorloopt dan de originele kwaliteits-, ontvanger-, suppressie- en providercontroles. Geen alternatief mailsysteem of extra scheduler.
- **Test:** `tests/brain-verified-research-composer-handoff-20261109.test.mjs` — positief geval en negatieve gevallen voor vreemde personen/bedrijven, stale bron, ongeverifieerd resultaat, ontbrekend heronderzoek en geen impliciete verzendrechten.
- **Broncode:** `supabase/functions/_shared/verified-research-composer-handoff.mjs`, `supabase/functions/powerhouse-commercial-message-composer/index.ts`.
- **Bewijsgrens:** vóór geslaagde verplichte checks, merge en Supabase productie-readback `FIX_CANDIDATE_NOT_LIVE`. Na deployment blijft `sent` onwaar zonder echte provider-ID en onafhankelijke readback; revenue alleen na gekoppelde werkelijke omzet.
- **Preventie:** nooit succes claimen op cron/HTTP-start, interne `done`, concept, hypothetische intent of niet-gerandomiseerde CRO/Innovation-resultaten.

Incident in bestaande ONE BRAIN runtime-events: `p0-20261109-commercial-research-composer-handoff`.
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5543


## Addendum 9 november 2026 — herstel van voortijdig verlopen acties
De oorspronkelijke closure-watchdog liet e-mails met een geldige onderzoekstaak na zes uur verlopen terwijl brononderzoek of composer nog niet was afgerond. Ook de oorspronkelijke e-mailwatchdog kon een `waiting` actie na twintig minuten terugzetten naar `prepared` zonder bewijs dat de composer het brononderzoek had geaccepteerd. Beide overdrachten behoren tot één keten en zijn in dezelfde PR hersteld.

- Originele actie wordt maximaal 48 uur op `WAIT_FOR_VERIFIED_SOURCE` gehouden als bijbehorend onderzoek werkelijk bestaat en aan dezelfde persoon en organisatie toebehoort.
- De generieke watchdog blijft af van die onderzoekshold en rapporteert hem als een waarschuwing, niet als verzonden mail.
- Alleen de originele composer zet `waiting -> prepared` na bronverificatie én geslaagde kwaliteit; de originele sender controleert vervolgens ontvangersautorisatie, opt-out, dedupe en providerreadback.
- Na 48 uur zonder goedkeuring wordt de actie veilig `expired` en alleen nieuw actueel bewijs mag een nieuwe, gededupliceerde commerciële actie opleveren.
- De twee reeds op 9 november verlopen acties worden niet heimelijk heropend en niet als verstuurd gemeld.

Bron/migratie: `supabase/migrations/20261109213200_powerhouse_outreach_research_wait_handoff_v1.sql`.
Technische en businessbewijsgrens: pas na beschermd merge, Supabase migratie/Edge readback en een echte providerbevestiging is de release aantoonbaar operationeel.


## Addendum: operationele funnelanalyse in dezelfde closing watchdog
- Geobserveerde cohortdata (2026-11-09, laatste 7 dagen): 11 orig. e-mailacties, 11 gelinkte researchacties, 4 afgeronde met bron, alle 4 originele e-mails toch verlopen, 0 bewezen composerkwaliteit, 0 bewezen providerreceipt, 0 replies. Experimenteerregister: 1 totaal, 0 laatste 30 dagen, 0 treatment/holdout laatste 30 dagen.
- Oorzaak: succesvolle interne schedulersteps maskeren verlies van context tussen originele brononderzoek- en composeractie. Geen bewezen observaties voor experimenten of omzet.
- Herstel: `handoff_measurement` wordt in bestaande `bg_gezondheid` van `powerhouse_commercial_action_closure_watchdog_v1` meegeschreven; dezelfde `action_id`-cohort en 7d denominator, expliciete onderzoeksuitval, laatste kwaliteitsbewijs, provider-ID en readback, replies en sample/maturity van bestaande `persuasion-revenue-optimizer-v1`-experimentpolicy.
- Data-uitkomsten zijn observaties, geen causaal bewijs. Leg treatment en holdout uitsluitend via bestaande policy en assignment-owner vast; pas experimentadviezen toe na analyse, controle op contaminatie en voldoende daadwerkelijke provider/outcome-readbacks.
- Regression: `tests/brain-verified-research-composer-handoff-20261109.test.mjs`. Geen nieuwe cron, parallel database of verzender. Protected release PR #5543 en bron-/provider-readback blijven vereist.


## Handoff assurance — meetbewijs en leercontract
- Productiebaseline gecontroleerd via read-only SQL: 11 `autonomous_email` acties in zeven dagen; 11 expired; 4 research done / originele composer ontbreekt, 7 overige geen levering.
- Huidige experimentautoriteit: 1 treatment, 0 holdout, minimum 20 voltooide observaties per arm. Geen valide effectgrootte of uplift.
- Geen wijziging aan bestaande scheduler, commerciële brondata, ontvangers, bestaande policy, provider of verzendlimiet.
- De SQL-view is read-only, SECURITY INVOKER, beperkte uitvoer voor service_role; bestaande e-mailwatchdog is de **enige** owner die de meetuitslag in de bestaande `bg_gezondheid` registreert.
- `EXPLAIN (FORMAT JSON)` en read-only productiequery op de nieuwe telemetrie-selectie zijn succesvol uitgevoerd; de werkelijke `handoff_state`-verdeling is 4 `BROKEN_RESEARCH_TO_COMPOSER_EXPIRED`, 7 `EXPIRED_WITHOUT_DELIVERY`. Dit is geen deploymentbewijs.
- Geen causale experimentclaim zonder voldoende gematureerde treatment én holdout, onafhankelijke echte uitkomst, anti-contaminatie, onveranderlijke experimenttoewijzing en retrospectief gemeten effect.
- Bestaande PR #5543 blijft OPEN tot originele branch-associatie, required CI, protected merge en echte Supabase/productie-readback. Status nog steeds `DEGRADED`.


## Provider-metric handoff — exact observatie en regressie
Tijd 2026-11-09 circa 16:47 UTC. Originele `provider-social-metrics:2026-11-09` runtime-evidence stond `healthy:true`, 20 Composio snapshots en 4 door Windsor geverifieerde bedrijfskoppelingen. Per origineel LinkedIn-persoonlijk provider-ID echter wel eigen `social_metric_snapshots` (5/8 reacties) maar geen `content_publication_obligations.measured_at`. Root cause: provider sync bewaarde alleen `social_metric_snapshots` en de originele publicatieverplichting ontving de volwassen meting niet terug. Herstel door exact ID/tenant/source/≥24h, CAS original updated_at, readback source event en scoped metric, geen `LEARNED` of channel-mix. Dezelfde BRAIN-incidentkey `p0-20261109-commercial-research-composer-handoff`, dezelfde PR #5543 en dezelfde bestaande zesuurs-owner. Regressie: `tests/brain-verified-research-composer-handoff-20261109.test.mjs`. Producer receipt moet later als bewijs tonen dat originele 8 Nov LinkedIn persoonlijke providerreacties ontvangen zijn; extra 9 Nov early observation mag niet als rijpe 24u metriek worden gefingeerd.


## 20:08 UTC — blog approval/queue-state regression in production
Direct SQL: 36 canonieke kanaalverplichtingen van 1–9 november, 13 LIVE_PROVEN, 0 `measured_at`, 0 `learned_at`. Blog 9 nov: GENERATED, approved_at aanwezig (06:10:39Z), gepubliceerd=null, live_proven_at=null. Vooraf 8 nov blog LIVE_PROVEN. Broncode `powerhouse-blog-queue/index.ts` gebruikte een onvoorwaardelijke `p_status:'GENERATED'` bij `record_content_publication_state`, ook voor al goedgekeurde blogs. DB `content_publication_state_rank('GENERATED')=20`, `APPROVED=30`, monotone RPC geeft bij gerangschikte terugstap originele rij zonder nieuw queue-ontvangstbewijs terug. Originele patch bewaart approval status, faalt bij inconsistent `approved_at`+GENERATED, en valideert `idempotency_key` + `next_executor` bij originele RPC-readback. Geen opgelegde goedkeuring, dubbel blog, externe providerwrite of nieuwe scheduler.


## 20:23 UTC — original producer-consumer handoff assurance
Direct productiecheck 9 nov: 36 originele kanaalverplichtingen 1–9 nov, 13 LIVE_PROVEN, 0 gemeten, 0 learned; 0 externe email-done laatste 7 dagen. `enforce_content_publication_daily_invariant` controleert alleen publicatiebewijs, niet `measured_at`, causaliteit of latere toepassing. De bestaande uurlijkse `powerhouse_content_closed_loop_tick_v1` doet al source-reconcile, measured, failed reports en recovery; nieuwe `powerhouse_original_handoff_receipt_audit_v1` wordt binnen exact die functie/job #140 aangeroepen. Geen nieuwe cron/tabel/outbound. Schrijft een idempotent origineel receipt in `powerhouse_runtime_events` per datum/kanaal met plichts-ID, provider-ID, eerstvolgende ontbrekende fase, owner en SLA; elke run in `bg_gezondheid` maakt achterstand tijdreeks. Commerciële emails via bestaand `powerhouse_commercial_handoff_scorecard_v1`.
Bestaande automatiseertaak `Powerhouse Metingen & Verzending` is bijgewerkt als consumer: echte acties terug bij oorspronkelijke eigenaren en controleren bij volgende natuurlijke uitvoering. Complete status alleen na provider/source/analytics/experiment/actual improvement/next-run readback. Vereist nog originele native protected release, Supabase deployment, onafhankelijke bronreadback. Niet als live claimen.


## 2026-11-09 21:20 UTC — receiver-ack is not result/closure
Production diagnosis: the original content publisher cron #140 exists and runs hourly, but independent `original-handoff:*` events and `powerhouse_original_handoff_receipt_audit_v1` are not deployed; they exist only in candidate PR #5543. Existing recovery_queue contains historical cron failure reviews but no verified original owner receipt/processing proof for the blocked November publications; creating another queue would not close this.
Added in existing SQL migration: each original dated/channel handoff has a stable fingerprint built from actual provider+metric+analysis+experiment+application+next-run evidence, first-seen UTC and last real progress UTC; unchanged hourly audits are NOT treated as refreshed progress. Missing receipt/unchanged proof after two ticks or SLA deadline yields stable `STALLED...`/`OVERDUE...` original event with exact next owner and instructions. Separate service-only `powerhouse_claim_original_handoff_v1` accepts only exact original open event, expected current owner, fingerprint, and a real caller's source-run ID. Its ACK explicitly says `RECEIVED_NOT_PROCESSED` and retains the original event OPEN; actual progress is verified independently during the next original hourly run. Existing four automation prompts now read/claim/act/recheck rather than assume sending or analyzing happened.
Source checks: Required hygiene/preflight/backend/Supabase source contract successful. Protected Required aggregator fails on provider `PREVIEW_BRANCH_UNASSOCIATED`, and product deployment remains blocked. No new scheduler, duplicate publication, email, or commercial result.

## 10 november 2026 — correcte deadlines voor oorspronkelijke ontvangers
De eerdere source-only audit zou al na twee uurlijkse runs zonder veranderd providerbewijs een `STALLED` kunnen tonen, ook wanneer een LinkedIn-post nog geen 24 uur oud is, een experiment zijn observatieperiode nog niet heeft voltooid, of de dagelijkse meetagent nog niet is gestart. Dat is een **false-positive**-incident in de kandidaat en zou ten onrechte herstelacties kunnen uitlokken.
In dezelfde PR #5543 en migratie `20261109213200_powerhouse_outreach_research_wait_handoff_v1.sql` zijn *ontvangst-SLA* en *uitvoering-maturity* gescheiden. Onbevestigde eigenaars volgen hun werkelijke uitvoeringscadans (28h dagelijkse analytics/analist, 24h blog, 8h experiment/leren, 6h overige). Uitvoeringsstagnatie geldt pas nadat het vereiste provider- of experimenteervenster werkelijk actie toestaat; hard overdue blijft direct rood. `bg_gezondheid` kleurt voortaan ook rood bij onopgevolgde ontvangers/gestagneerde acties, niet alleen bij `deadline_overdue`. De bestaande Growth & Revenue OS is aangescherpt om tijdens haar vier dagelijkse natuurlijke runs de liveness van bestaande cron #140 onafhankelijk te controleren (stale >2h -> `CRON_STALLED`, bestaande ONE BRAIN herstelroute). Geen extra scheduler. Beschermde broncontrole, providerpreview, merge en daadwerkelijke natuurlijke-run verificatie blijven vereist.
