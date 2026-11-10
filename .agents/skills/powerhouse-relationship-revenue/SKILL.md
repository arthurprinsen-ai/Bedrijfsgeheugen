# Skill: Powerhouse Relationship Revenue

Fingerprint: `powerhouse-relationship-revenue-engine-v1`

## Doel
Activeer de bestaande relatie- en bedrijfsgraph als commerciële asset richting eerste betaalde order en gerealiseerde omzet, zonder een parallel CRM of externe vendor als brein te introduceren.

## Canonieke bronvolgorde
1. **Powerhouse first-party**: `bg_connecties`, person/company intelligence, runtime events, opportunities, actions, outcomes, forecasts en learnings.
2. **Publieke web-evidence**: bedrijfswebsite/newsroom, vacatures, publieke nieuws- en marktbronnen en publiek toegankelijke LinkedIn/company context waar dat rechtmatig en technisch toegestaan is.
3. **Optionele vendor fallback**: Apollo, Lusha, ZoomInfo of vergelijkbaar alleen wanneer een concreet bewijs- of contactdatagat na stap 1 en 2 overblijft.

Externe vendors zijn nooit canonical truth, nooit vereist voor de dagelijkse loop en nooit eigenaar van scoring of next-best-action.

## Beslisregels
- Relatiewarmte is **geen kooptrigger**.
- Gebruik bestaande relatie-, beslissers-, company-intent-, recency- en outcome-evidence om research te prioriteren.
- Maak bij onvoldoende actuele evidence een `research_enrichment` actie op kanaal `internal`.
- Alleen wanneer reeds echte opportunity-/waarde-evidence bestaat, mag een `commercial_outreach_review` worden voorbereid.
- Autonome outbound is door de gebruiker expliciet geautoriseerd voor bestaande relaties wanneer fresh evidence, suppression, cooldown en kanaalvalidatie groen zijn.
- Geen scraping, platform-bypass, bulk-DM of generieke pitch.
- Dedupe acties en respecteer fatigue/suppression.
- Optimaliseer voor paid order en realized revenue, niet voor aantallen leads of berichten.

## Runtime authority
- View: `public.powerhouse_relationship_revenue_intelligence_v1`.
- Refresh: `public.powerhouse_refresh_relationship_revenue_v1(date)`.
- Bestaande dagelijkse owner: `powerhouse-commercial-learning-v1` via `public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)`.
- Volgorde: relationship revenue -> trigger acquisition -> commercial learning.
- Geen tweede scheduler, CRM, action queue of learning store.

## Bounded execution
Per cycle maximaal 50 research-selecties en 20 activation reviews. Research is intern. Externe opvolging mag autonoom via een ondersteund kanaal wanneer de relatie- en evidence-gates groen zijn. Handmatige goedkeuring per bericht is niet vereist.

## Learning
Meet research -> validated trigger, activation review -> contact, contact -> reply, reply -> meeting, meeting -> scan, scan -> order en realized revenue. Schrijf uitkomsten terug naar dezelfde canonical sales/outcome/forecast lineage zodat scoring zichzelf kalibreert.


## Automatische research execution
Fingerprint: `powerhouse-relationship-research-auto-enrichment-v1`.

De commerciële cyclus voert research nu zelf uit tegen bestaande publieke Powerhouse-bronnen: `bg_bedrijfsnieuws`, `bg_externe_signalen` en `powerhouse_predictive_signals`. Alleen een echte evidence-match wordt als `VERIFIED` runtime event teruggeschreven. Geen match blijft zonder verzonnen trigger staan en kan in een latere cyclus opnieuw worden onderzocht nadat de bestaande nieuws/signaal-ingest nieuwe evidence heeft aangevoerd.

De volgorde in dezelfde scheduler is: relationship ranking -> research execution -> trigger acquisition -> commercial learning. Geen aparte cron toevoegen.


## Autonome research-uitvoering
De engine stopt niet bij een research-queue. `public.powerhouse_execute_relationship_research_v1(date)` hergebruikt bestaande Powerhouse-evidence. Wanneer die ontbreekt dispatcht `public.powerhouse_dispatch_relationship_public_research_v1(date)` de Edge Function `powerhouse-relationship-public-research` vanuit dezelfde bestaande commerciële scheduler. Deze worker zoekt bounded publieke SERP-evidence via de bestaande DataForSEO-credentials, schrijft alleen gevonden evidence terug naar `powerhouse_runtime_events` en triggert daarna de bestaande MKB-triggerrefresh. Geen tweede scheduler, geen Apollo-afhankelijkheid en geen externe outreach.


## Productieplanning
De live Edge Function `powerhouse-relationship-public-research` wordt vanuit dezelfde bestaande `powerhouse-commercial-learning-v1` cyclus gedispatcht. De canonical scheduler blijft de enige scheduler-owner. Geen tweede cron, geen tweede brein en geen losse commerciële schedulerfamilie.


## Terminal production proof — 28 september 2026

Status: `LIVE_PROVEN`.

Protected main bevat merge `35f465c613cdc32f37f0dd2810e86ceb1518be08` van PR #3155. Productie-readback bevestigt:
- 2.105 relaties boven de researchdrempel;
- 10 actuele public-research events;
- 10 evidence-backed trigger-opportunities;
- 8 afgeronde relationship-research acties;
- Edge Function `powerhouse-relationship-public-research` ACTIVE;
- exact één scheduler-owner: `powerhouse-commercial-learning-v1`;
- nul parallelle relationship-research crons;
- `apollo_required=false`;
- autonome externe outreach was in deze historische production proof nog niet actief; de opvolgende autonomous-outreach skill vervangt die beperking.

Daarmee is de vaste regel: Powerhouse is het sales-intelligencebrein; publieke webdata is evidence-input; externe commerciële databrokers zijn alleen optionele fallback en nooit authority.


## Autonome outbound
Fingerprint: `powerhouse-autonomous-relationship-outreach-v1`.

Powerhouse mag zelf commerciële opvolging uitvoeren zonder per bericht opnieuw menselijke goedkeuring te vragen, maar alleen binnen harde grenzen:
- uitsluitend bestaande relaties met status `in_gesprek`, `aangeboden` of `rust`;
- alleen bij een verse evidence-backed trigger van maximaal 30 dagen oud met confidence >= 0,60;
- maximaal 5 autonome sends per dag;
- maximaal 1 succesvolle e-mail per persoon per 30 dagen;
- `unsubscribe`, `opt_out`, `do_not_contact`, `complaint` en `negative_reply` blokkeren automatisch vervolgcontact;
- provider acknowledgement moet bestaan voordat een actie `done` wordt;
- dedupe/republish-forbidden voorkomt dubbele verzending;
- Gmail via de bestaande Composio-verbinding is het ondersteunde primaire kanaal;
- LinkedIn DM wordt alleen gebruikt wanneer een daadwerkelijk ondersteunde DM-capability beschikbaar en geverifieerd is; nooit een niet-bestaande capability simuleren.

Runtime: `public.powerhouse_prepare_autonomous_outreach_v1(date)` -> `public.powerhouse_dispatch_autonomous_outreach_v1(date)` -> Edge Function `powerhouse-autonomous-outreach`. De bestaande `powerhouse-commercial-learning-v1` blijft enige scheduler-owner.


## LinkedIn sales machine
Gebruik `powerhouse-linkedin-sales-machine-v1` als sociale commerciële laag vóór of naast private outreach. Een concrete relevante LinkedIn-post kan een contextuele commenttouch krijgen; geaggregeerde triggerpatronen voeden `linkedin_company` als sales-air-cover; inbound engagement wordt intent-evidence. LinkedIn DM wordt nooit gesimuleerd wanneer de provider geen send-DM capability heeft. In dat geval blijft e-mail de private fallback. Bij een geslaagde LinkedIn-comment wacht private e-mail 24 uur.


### Revenue-first kanaalbeslissing
De Relationship Revenue Engine geeft niet alleen leads door. Bij iedere gekwalificeerde relatie kiest Powerhouse zelfstandig de beste toegestane vervolgstap uit `linkedin_context_comment`, `linkedin_company_air_cover`, `private_email`, `nurture_wait` of een later ondersteund kanaal. De keuze wordt gevoed door first-party relatie-evidence, actuele triggerkwaliteit, eerdere touches, fatigue/suppression en gerealiseerde outcomes. Een ontbrekende provider-capability mag nooit worden gesimuleerd.


## Growth Swarm projection
Alle relationship intelligence projecteert voortaan ook naar `powerhouse-growth-swarm-v1`. Relationship warmth blijft geen kooptrigger; het is één feature naast fresh trigger evidence, dark-funnel convergentie, friction/knowledge/M&A risk, economic evidence, fatigue en outcomes. De Growth Swarm kiest daarna de volgende play en het kanaal, of bewust `research_and_wait`. Geen parallel CRM.


## Externe relatie-intelligentie
Gebruik standaard `powerhouse-relationship-external-intelligence-v1`. Relevante publieke internet-, bedrijfs- en ondersteunde LinkedIn-updates worden na geldige entity matching gekoppeld aan de canonieke person → company → customer → opportunity/NBA-lineage en wegen mee in scoring, timing en next-best-action. Externe evidence is nooit op zichzelf koopintentie; provenance, freshness, confidence, suppression, cooldown en outcome-learning blijven harde gates. Geen gevoelige persoonsinferenties en geen los nieuwsarchief als eindpunt.


## Daily full connection enrichment
Gebruik permanent `powerhouse-daily-full-connection-enrichment-v1`. Iedere canonieke connectie wordt iedere kalenderdag opnieuw verrijkt met alle reeds ingeladen relevante LinkedIn-, bedrijfs-, publieke web-, runtime-, opportunity- en outcome-evidence. De full-graph refresh draait set-based binnen de bestaande `powerhouse-commercial-learning-v1` scheduler. Gedetailleerde evidence blijft in de canonieke bronstores; de dagelijkse enrichment-state is een rollup/provenance-laag en geen parallel CRM. Nieuwe evidence die later op de dag binnenkomt wordt bij de volgende bestaande commerciële cyclus opnieuw op de volledige graph geprojecteerd.


## €1M Revenue Operating Contract — 29 september 2026
Fingerprint: `powerhouse-one-million-revenue-operating-contract-v1`.

Deze skill erft verplicht `config/powerhouse-one-million-revenue-operating-contract-v1.json`.

Niet-onderhandelbaar:
- North star: €1.000.000 gerealiseerde omzet binnen 365 dagen; paid order en realized revenue wegen altijd zwaarder dan bereik, traffic, posts, scans, leads of meetings.
- Elke dagelijkse commerciële run kiest uit één gedeelde next-best-action ruimte: bedrijfspost, Mira-Instagram, SEO/blog/CRO, contextuele LinkedIn-reactie, warm/consented e-mail, ondersteunde private follow-up, due follow-up, offerte/offer follow-up, warme referral, partner/workshop follow-up of value asset.
- Een gekwalificeerde veilig uitvoerbare actie wordt uitgevoerd; alleen aanbevelen/draften is niet terminal wanneer de canonieke executor beschikbaar is.
- Achterstand op omzetpace verhoogt kwaliteit en aantal gekwalificeerde research/value/follow-up-acties, maar omzeilt nooit evidence, identity, privacy, consent, suppression, dedupe, fatigue of provider-ack gates.
- Generieke cold-bulk autosend blijft verboden. Koude prospects mogen automatisch worden gevonden, verrijkt, gescoord en voorbereid; extern verzenden gebeurt alleen binnen een afzonderlijk goedgekeurde lawful/consent-based eligibility route.
- Warm/consented outreach, bestaande relatie/opportunity follow-up, due follow-up en bestaande klant-/partnercontext mogen autonoom worden uitgevoerd wanneer de bestaande gates groen zijn.
- LinkedIn persoonlijk blijft personal-life-only; commercieel air-cover hoort op de Bedrijfsgeheugen-bedrijfspagina. Instagram blijft Mira-only.
- Iedere kanaalactie schrijft terug: provider/readback → reply/meeting/scan/proposal/order → realized revenue → learning → volgende prioritering.


## Bounded relationship revenue refresh — 29 september 2026
Fingerprint: `relationship-revenue-bounded-refresh-v1`.

De relationship-engine selecteert eerst actuele kandidaten uit recente runtime-events, open opportunities, recente outcomes en recent bijgewerkte warme relaties. Pas daarna worden relationship score, evidence score, research need en activation readiness berekend.

Population-wide materialisatie van `powerhouse_relationship_revenue_intelligence_v1`, `powerhouse_person_intelligence_v1` of `powerhouse_company_intelligence_v1` vóór candidate pruning is een performance-regressie.

De bestaande harde regels blijven gelden: max 3 acties/30 dagen per persoon, geen generieke pitch, externe outreach alleen via de afzonderlijk geautoriseerde consent/relationship executor, identity/destination verification en realized-revenue truth.


## Closed email reply → revenue learning — 29 september 2026
Fingerprint: `powerhouse-email-reply-learning-v1`.

Een autonome e-mail is nooit terminal op `sent`. De canonieke commerciële lineage is:
`sales_action/send → Gmail provider readback → reply_event → classification → suppression/follow-up → sales_outcome → meeting/scan/proposal/order → realized revenue → learning → next-best-action`.

Harde regels:
- iedere Gmail-reply wordt exact-once verwerkt op provider message ID;
- de reply blijft gekoppeld aan de oorspronkelijke `powerhouse_sales_actions.action_id` via `powerhouse_email_reply_events.action_id`;
- classificaties omvatten minimaal `positive`, `question`, `objection_price`, `objection_timing`, `objection_need`, `objection_authority`, `negative`, `unsubscribe`, `other`;
- expliciete unsubscribe/do-not-contact en duidelijke “geen interesse; wij nemen zelf contact op” activeren `powerhouse_email_contact_suppressions`;
- suppressie is een harde write-time guard voor toekomstige `autonomous_email` acties en mag niet door een alternatieve executor worden omzeild;
- timing-replies mogen precies één gededupliceerde nurture/follow-up action krijgen met thread- en datumcontext;
- positieve replies/vragen/actionable objections mogen precies één contextuele follow-up krijgen; geen duplicate follow-ups;
- learning optimaliseert primair op realized revenue en orders, daarna proposal/meeting/positive reply; reply-volume is secundair;
- geen tweede reply-cron, inbox-store, CRM of learning-loop: owner blijft `Powerhouse Growth & Revenue OS` / `powerhouse-commercial-learning-v1`;
- als de bestaande cycle-engine een tweede outcome op een reeds gesloten send-cycle niet accepteert, blijft `origin_action_id` evidence-bound via het reply-event/outcome-evidence; de cycle guard wordt niet omzeild of verzwakt.

Productieproof 2026-09-29:
- Gmail readback leverde twee echte replies op;
- DID Telecom → `objection_need` + actieve suppressie;
- Tech Festival → `objection_timing` + één nurture-action voor 2027;
- `powerhouse_refresh_email_learning_stats()` telt deze replies terug in de revenue-first learning projection;
- parallelle `powerhouse-email-reply-loop-hourly-v1` cron is verwijderd; één canonieke owner blijft over.


## Geen fictieve verzending bij ontbrekende bron — 30 oktober 2026
Fingerprint: `powerhouse|outreach|composer-source-preflight-held-but-dispatcher-loses-exact-cause|20261030-v1`.
ONE BRAIN-bron: `brain/learning/2026-10-30-outreach-composer-source-handoff-v1.json`; menselijk herstelcontract: `docs/changes/2026-10-30-outreach-composer-source-handoff.md`.

Bij de oorspronkelijke autonome outreach-lus is **een geslaagde cronrun, een ontvangersgoedkeuring of een voorbereid bericht nooit een bewezen verzending**. Een actie met alleen een LinkedIn-profiel, `human_readable_context=false`, `source_trigger_relevance=false` of zonder concrete gebeurtenis blijft `prepared`. De originele `powerhouse-commercial-message-composer` retourneert dan `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` met exacte ontbrekende velden. De oorspronkelijke `powerhouse-autonomous-outreach` moet deze reden veilig in de **dezelfde actie** en bestaande `bg_gezondheid` opslaan; geen tweede herstelagent, scheduler of e-mailkanaal. De bestaande relationship-public-research-agent mag alleen een **werkelijk** geverifieerd bedrijfssignaal van de **juiste** relatie aanvullen. Afwezigheid van bewijs blijft een open researchverplichting, geen kunstmatige `source_trigger_relevance=true`.

Neem altijd broncontext → echte persoonsgebonden autorisatie → opt-out/suppression/fatigue → originele subject/body → geslaagd `powerhouse_message_quality_v1` score-/noveltyrapport → exacte claim → Gmail provider-ID → onafhankelijke `GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID` met `SENT` en exacte ontvanger → status `done` → Heartbeat `action/readback`-receipts. Bij een ambigu providerresultaat geen nieuwe verzending. De dagelijkse executor blijft actief, maar een geldige blokkade wordt niet als succes vermomd. Geen versoepeling van de kwaliteits- of privacydrempels. Regressie: `tests/brain-outreach-composer-source-handoff-20261030.test.mjs`; deze SkillOps-regel is alleen als **live** bewezen na beschermde merge, originele Edge-deploy en onafhankelijke volgende natuurlijke run.


## ONE BRAIN bronsignaal-herstel binnen dezelfde outreach-lus — 30 oktober
Fingerprint: `powerhouse|outreach|source-gap-not-routed-to-original-relationship-research|20261030-v1`.
Bij `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` moet de **oorspronkelijke** `powerhouse-autonomous-outreach` één gededupliceerde `research_enrichment/internal` in de **bestaande** `powerhouse_sales_actions` inschrijven met `relationship-research:outreach-source:<action_id>`. De oorspronkelijke relationship-public-research-agent en commerciële scheduler verwerken de bron; geen tweede agent, scheduler of CRM. Blijf bij `prepared` en registreer open bronvelden op dezelfde action. Zonder een werkelijk nieuw, op de juiste onderneming herleidbaar signaal volgt géén `source_trigger_relevance=true`, kwaliteitsgroen of Gmail-send. Het bestaande portaal Andere data mag uitsluitend geaggregeerde gegevens tonen en moet uitval van de bron als `UNVERIFIED` melden. `research_enrichment done` is géén klant-, omzet- of providerbewijs; `action/readback` blijft leeg tot originele geautoriseerde Gmail-send met provider-ID, SENT-label en exacte ontvanger onafhankelijk bevestigd is. Zie `brain/learning/2026-10-30-outreach-research-closed-loop-v1.json`, `docs/changes/2026-10-30-outreach-research-closed-loop.md` en `tests/brain-outreach-research-to-portal-20261030.test.mjs`.


## Originele research → bronkandidaat → veilige volgende natuurlijke run (30 oktober 2026)
Fingerprint: `powerhouse|outreach|research-source-found-but-not-returned-to-original-action-and-no-signal-retries|20261030-v1`. Broncode en bewijs in `brain/learning/2026-10-30-relationship-research-source-backfeed-v1.json`, `docs/changes/2026-10-30-relationship-research-source-backfeed.md`, `tests/brain-relationship-research-source-backfeed-20261030.test.mjs`.

De originele `powerhouse-relationship-public-research` moet bij een werkelijk gevonden publieke bron het exacte oorspronkelijke `autonomous_email`-record veilig terugvinden op **action UUID + person_key + company_key**, en uitsluitend na `status=prepared`, bestaande `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` en `updated_at` CAS een **onbevestigde** `relationship_source_candidate` registreren. Een zoekresultaatsnippet heeft zonder onafhankelijke bronpagina en publicatiedatum altijd `freshness_verified=false`, `source_page_independently_read=false`, `message_quality_approved=false`, `provider_send_authorized=false`; verander niet `public_source_evidence`, actie-`source_url`, provider-ID of `status=done`. De oorspronkelijke composer-kwaliteit, toestemmings-/suppressiepoorten en Gmail-SENT-readback blijven doorslaggevend.

Als oorspronkelijke SERP-broncontrole geen signaal vindt, blijft de interne `research_enrichment` op `waiting` maar met `due_at` voor de volgende **bestaande** natuurlijke controle 24 uur later. Geen nieuw cron, tweede Brain, nieuwe commerciële outreach-agent, gedwongen API-poll of achterstandsinjectie. Portal Andere data toont uitsluitend bronwachtrij, kandidaatstatus en volgende controle als aggregaten, naast de originele 15 lussen en zeven CRO-bewijzen. Een geslaagde onderzoeksstap maakt `action/readback` niet groen; onafhankelijke providerbericht-ID, SENT-label en ontvanger blijven vereist. Houd incident `OBSERVED` tot een échte natuurlijke readback van de nieuwe code is bevestigd.


## Wekelijkse e-mailantwoorden, connecties en aantoonbare orders binnen ONE BRAIN (30 oktober)
Gebruik het originele `powerhouse_email_reply_events`, de oorspronkelijke Gmail provider-ID/readback, `powerhouse_sales_outcomes` en de canonieke `powerhouse_revenue_attribution_snapshot_v1` als losse bewijslagen. Historische `powerhouse_email_learning_stats` counts zijn niet automatisch verzend- of antwoordbewijzen voor elke e-mail. Portaal **Andere data** toont alleen geaggregeerde, dedupliceerbare e-mail-replyevents, onbekende reply→orderconversie als **null**, bronkwaliteit en het echte experimentbewijs; geen emailadressen of persoonsniveau. Houd `ordersFromEmail` en `ordersFromConnections` expliciet onbekend totdat werkelijk betaalde orders onafhankelijke bron- en actieattributie hebben. Geen dubbele mails/DM's, geen ongeautoriseerde likes of comments, geen geforceerde kennismaking; update de bestaande ONE BRAIN-learning na geldige provider-readback en een volgende natuurlijke run. Dit is één marketingfunnel met CRO, SEO en Heartbeat; gebruik dezelfde `brain/learning/2026-10-30-one-brain-growth-direction-v1.json` en `tests/brain-powerhouse-growth-direction-20261030.test.mjs`. Stijging is het verbeterdoel en kan niet kunstmatig afgedwongen worden.


## Bron van e-mail/LinkedIn-connectie tot koopbewijs (30 oktober 2026)
Wanneer bestaand Powerhouse-onderzoek via LinkedIn persoonlijk/bedrijf, Instagram of toestemminggebonden e-mail een bezoeker naar website en daarna naar een commerciële CTA leidt, mogen de oorspronkelijke CRO-producers na toestemming alleen vaste `source/medium/campaign`-categorieën en dezelfde tab-scoped `attribution_root` aan de bestaande Growth Event koppelen. De e-mailcontactautoriteit en provider-msg/SENT + ontvanger-/replyreadback blijven onafhankelijk vereist. Het proces kent geen automatische order uit één klik, reply of 202 queue-ACK; een verkoop wordt pas aan bron gekoppeld na een gekwalificeerde toestemming-gebonden lead en onafhankelijke betaal-/order-provider-ID. ONE BRAIN houdt de leerregel `powerhouse|cro|consented-channel-to-cta-attribution-and-session-root-split|20261030-v1` open totdat echte natuurlijke funnelmetingen dit aantonen; geen dubbele outreach, extra scheduler, fake conversion of direct marketing zonder toestemming. Test: `tests/brain-cro-consented-first-touch-attribution-20261030.test.mjs`.

## P0 10 november 2026 — oorspronkelijke onderzoeks-handshake mag geen reeds goedgekeurd concept verliezen

Incident: `powerhouse|commercial|verified-research-quality-passed-waiting-excluded|20261110-v1`.

De ene originele commerciële lus blijft `bg_connecties` → bedrijfs-/publiek brononderzoek → `powerhouse_sales_actions` → `powerhouse_commercial_message_candidates_v1` → oorspronkelijke `powerhouse-commercial-message-composer` → oorspronkelijke `powerhouse-autonomous-outreach` → provider-ID en onafhankelijke Gmail-readback → `powerhouse_sales_outcomes` → experiment/learning → ONE BRAIN/Heartbeat. Geen tweede scheduler, queue, CRM of sender.

**Verplichte herstartregel:** als een reeds `quality_passed=true` concept `waiting` bleef met `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`, moet de **oorspronkelijke composer** de actie uit dezelfde originele berichtplan-view teruglezen, ook wanneer de ongewijzigde kandidaat-RPC haar eerder wegfilterde, **nadat** de bijbehorende `research_enrichment` `done` is en een actueel, gecontroleerd `bg_bedrijfsnieuws`-record met identieke bron en person/company lineage aanwezig is. De oorspronkelijke composer controleert die lineage en alle feiten opnieuw en geeft de actie alleen `prepared` na een nieuwe volledige kwaliteitscontrole. De oorspronkelijke Gmail-executor controleert daarna nog steeds actieve opt-out, relatie-/menselijke toestemming, contactfrequentie, atomische claim, provider-ID en onafhankelijke SENT/ontvanger-readback. Een `prepared`, `waiting` of `done` research-actie geldt **nooit** als verzonden e-mail.

**Handshake en bewijs:** bronbewijs → reselectie → composer-evaluatie → provider-ACK → provider-readback → outcome → experiment met voldoende behandelde en controlegroep → volgende werkelijke verbeterde uitvoering. Iedere stap zonder eigen ontvangstbewijs blijft OPEN bij de bestaande eigenaar; het bestaande Heartbeat/ONE BRAIN signaleert de breuk en de originele executor herstelt bij een volgende natuurlijke tick. Onbekende of verlopen signalen blijven veilig `research_and_wait`, niet automatisch verzonden. Geen valse groene status.

Regressie: `tests/brain-original-commercial-held-resume-20261110.test.mjs`; geen nieuwe SQL-migratie of schemarelease; de geïsoleerde Hosted Preview heeft de historische plan-view niet. Productiepaspoort: beschermde CI/CodeQL → merge → originele Edge-deploy → natuurlijke run met exact action-ID bron-/composerbewijzen → echte provider-ACK/readback → outcome/experiment. Tot die tijd alleen kandidaat, niet end-to-end groen.

## P0 10 november 2026 — onzekere Gmail-acceptatie is permanent NO RESEND

Incident: `powerhouse|commercial|prior-gmail-provider-id-reprepared-duplicate-send-risk|20261110-v1`. Een Gmail-send kan een externe message-ID opleveren maar bij onafhankelijke fetch de verkeerde ID tonen, ondanks `SENT` en dezelfde ontvanger. Dit is **ONBEWEZEN**, niet `sent`. De originele actie kan door upstream materiaalverversing toch terugkomen als `prepared`; de bron van die herstatussering is nog niet afzonderlijk bewezen.

**Harde originele verzendregel:** vóór iedere oorspronkelijke `GMAIL_SEND_EMAIL` blokkeert de bestaande `powerhouse-autonomous-outreach` iedere actie met een eerdere `provider_message_id` (ook top-level of native Gmail), `needs_readback=true`, `republish_forbidden=true` of `provider_ambiguity_quarantine.external_resend_forbidden=true`, ongeacht de huidige status. De originele actie wordt atomisch van `prepared` naar `waiting` teruggezet, met alle oorspronkelijke provider-ID's en bewijs intact; alleen de bestaande pending-readback-route mag **diezelfde** provider-ID controleren. Een nieuwe verzendpoging, nieuw account, tweede scheduler of autoresend is verboden. `dry_run` telt zulke acties evenmin als eligible. Blijf de oorspronkelijke cron draaien en meld het werk als `UNVERIFIED` tot exact provider-ID + onafhankelijk Gmail SENT/ontvangerbewijs wel sluiten.

Borg in ONE BRAIN/Heartbeat dat een statusovergang `waiting→prepared` na een onzeker providereffect **nooit** opnieuw marketingtoestemming of send-authority impliceert; respecteer toestemming, opt-out, fatigue, idempotentie en quality. Machineleerbewijs met historische replay, shadow en canary in `tests/brain-original-ambiguous-gmail-no-resend-20261110.test.mjs`. Productie groen pas na beschermde CI, officiële deploy-readback, echte volgende run met aantoonbaar géén dubbele verzending, en afzonderlijk op echte gegevens bevestigde outcome/experimenttoepassing.

## P0 10 november 2026 — Gmail messageId readback, nooit dubbel versturen

Composio `GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID` geeft de native Gmail-ID terug als `messageId` (camelCase), naast eventuele andere veldvormen. De **originele** `powerhouse-autonomous-outreach` moet de exacte opgevraagde bericht-ID, het onafhankelijke `SENT`-label en het volledige exacte ontvangstadres tegelijk verifiëren voordat zij `done` of `sent` als uitkomst opslaat. Een transport 200 of provider ID alleen is onvoldoende. De herbruikbare proof-helper `supabase/functions/_shared/verified-gmail-readback.mjs` en regressie `tests/brain-gmail-messageid-readback-only-20261110.test.mjs` bewaken deze invariant in historische replay, shadow en canary.

Als een oorspronkelijke verzending onzeker is: `waiting/needs_readback=true/republish_forbidden=true` blijft staan, nooit blind opnieuw versturen. De reeds bestaande sender biedt na volledige scheduler-tokencontrole `readback_only=true`: uitsluitend bestaande claims verifiëren, daarna stoppen vóór composer en nieuwe verzending. Houd status RED/AMBER totdat de bestaande `powerhouse_sales_outcomes` en Gmail-bron onafhankelijk overeenkomen; pas daarna bestaande BRAIN/Heartbeat/experiment consumer actualiseren, zonder omzet of experimenteffect te verzinnen. Geen extra cron, nieuwe sender, queue of Make/Buffer.

## P0 10 november 2026 — originele Gmail readback → commerciële dag-BRAIN (schema-overdracht)

Wanneer de **oorspronkelijke** Gmail sender `powerhouse-autonomous-outreach` `evidence.autonomous_outbound.provider_ack_verified=true`, `provider_readback_verified=true`, een exact `provider_message_id` en `provider_thread_id` bewaart, moet de **oorspronkelijke** `powerhouse_commercial_output_assurance_v1(date)` dit alleen als commerciële daguitvoering tellen wanneer óók een unieke externe `powerhouse_sales_outcomes.sent`-rij aanwezig is met dezelfde originele action-ID, dedupe, person, company, provider, bericht-ID en thread-ID. Een top-level legacy bewijs blijft volgens de bestaande regels geldig. Geen dubbel tellen; `status='done'` alleen is nooit genoeg. Overdracht is pas gesloten als de oorspronkelijke Heartbeat en `brain_obligations.COMMERCIAL_EXECUTION` dezelfde werkelijke `provider_proven_email` en provider-ID hebben, met onafhankelijke productie-readback. Bron: `supabase/migrations/20261110131500_original_commercial_nested_gmail_provider_outcome_assurance_v1.sql`, regressie `tests/brain-original-commercial-gmail-nested-brain-proof-20261110.test.mjs`. Nooit een extra cron, queue, sender, Make/Buffer of onterecht terugzetten van verlopen contactacties. Experimenten mogen niet retroactief worden toegewezen op basis van levering.

## 2026-11-10 — Original provider-applied migration lock must track real Supabase truth (#4198)
- No protected SQL source merge, deployed Edge code or content summary alone is an authorized entry in `supabase/migration-history.lock.json`. Update ONLY after an independent actual production `supabase_migrations.schema_migrations` / list_migrations confirms every existing historical name and version and exact newly provider-applied version/name. Record the provider observation time and real function readback, never mark merely proposed SQL applied.
- A missing production history observation can block unrelated protected PRs; fix the **original provider lock authority** by exact 1-to-1 reconciliation instead of weakening historical integrity tests, creating a parallel migration source, or retagging old files.
- Source regression: `tests/brain-commercial-applied-provider-lock-20261110.test.mjs`. Original incident owner #4198; this is a provider-history correction, not proof of external Gmail/LinkedIn/Instagram execution, outcome or revenue.

## P0 10 november 2026 — onderzoek-WAIT is géén verzend-WAIT (eindverantwoordelijkheid)

De **originele** `powerhouse_commercial_action_closure_watchdog_v1` draagt `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` tot 48 uur over aan **dezelfde** `relationship-research:outreach-source:<action_id>`-taak en originele composer. `commercial_closure.decision=WAIT_FOR_VERIFIED_SOURCE` betekent expliciet **niet verzenden**. De oorspronkelijke e-mailonderdrukking, outbound-kwaliteitscontrole en source-gate moeten die identieke onderzoeks-WAIT met originele actie/person/company/research-dedupe, juiste vaste 48-uursdeadline, geen eerdere provider-ID, geen onzeker resend-claim en `provider_send_forbidden=true` kunnen bewaren. Suppression/opt-out, toestemming, provider-no-resend en toekomstige PREPARED→WAITING **send**-claims blijven onverkort geblokkeerd zonder echte bron, kwaliteit en provider-readback. Een bron-WAIT krijgt uitsluitend `source_gate=PENDING_VERIFIED_SOURCE` en `send_forbidden=true`, nooit automatisch `PASS`. Na elke watchdog-run geldt een **readbackplicht**: gevraagde `WAIT` ≠ geslaagde handoff totdat dezelfde originele actie in de database werkelijk `WAITING`, met juiste research en deadline terugkomt. Een stilzwijgende triggeromzetting naar `skipped` is een P0-consumer-fout die dezelfde eigenaar moet herstellen. Canonieke regressie: `tests/brain-original-commercial-source-wait-ack-20261110.test.mjs`; native GitOps `supabase/migrations/20261110134500_original_source_wait_is_not_send_v1.sql`. Geen tweede cron, queue, afzender of blind herstel van verlopen acties.

## 2026-11-10 — tweede origineel provider→lock handoff-incident: 823e migratie (#4198)
- Dit is hetzelfde terugkerende foutpatroon als de 822e migratie: oorspronkelijke SQL wordt op `main` gemerged en native Supabase provider past deze correct toe, maar `supabase/migration-history.lock.json` veroudert. Een release is niet terminal zonder een onafhankelijke exact-version/name provider-readback én een beschermde terugkoppeling aan de oorspronkelijke migratiegeschiedenis-eigenaar.
- Eigenaar blijft ORIGINAL Growth & Revenue OS/ONE BRAIN; herstel door 823/823 exact te vergelijken en uitsluitend de aantoonbaar uitgevoerde 20261110134500 `original_source_wait_is_not_send_v1` toe te voegen. Niet testgates versoepelen, geen parallelle release, geen extra verzendingen of herzendingen.
- Preventieregel voor alle toekomstige uitvoerders: release-ACK `PROVIDER_APPLIED` is pas `HANDOFF_COMPLETE` nadat migratiehistorie en alle consumers de nieuwste exact-provider versie teruggelezen hebben; bij mismatch blijft dezelfde P0-eigenaar actief. Verificatie `tests/brain-commercial-applied-provider-lock-20261110.test.mjs`. Geen onbewezen TOTAL_GREEN.
