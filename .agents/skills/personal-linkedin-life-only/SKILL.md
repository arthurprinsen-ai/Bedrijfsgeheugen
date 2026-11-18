---
name: personal-linkedin-life-only
description: Enforce Arthur's personal LinkedIn as a strictly personal-life channel and route all business topics to the company page.
---

# Personal LinkedIn — personal life only

## 18 november 2026 — nieuw werkelijk gebruikersfeit hervat de originele geblokkeerde bronbeslissing

Fingerprint: `powerhouse|linkedin-personal|late-verified-user-fact-stale-hold|20261118-v1`. De originele persoonlijke `powerhouse_channel_decisions`-rij van 18 november stond sinds 17 november `hold/blocked` wegens `PERSONAL_TRUTH_SOURCE_UNVERIFIED`. Een daarna geregistreerd, echt gebruikersfeit met correcte, brongebonden identiteit werd wel door de originele bronmaterialisatie gevonden, maar de bestaande `powerhouse-content-loop` herstartte de originele `powerhouse-content-orchestrator` niet voor deze reeds bestaande blokkeringsrij. De scheduler bleef draaien terwijl de bron tot nu toe niet aan de schrijfeigenaar werd overgedragen.

**Verplichte herstelregel in de oorspronkelijke lus:** controleer bij een oude `hold/blocked` alleen een **nieuwer**, exact hetzelfde datum/tenant/kanaal, niet eerder afgewezen `verified_personal_source`-record. Gebruik de bestaande `personalFirstPersonSourceViolations` met echte `chat-history:user-fact`-lineage, identiteit- en privacyregels; controleer dat geen eerdere create, mogelijke providerside-effect, publicatiebewijs of verbruikte originele autorisatie bestaat. Bij één geldige bron: hervat enkel de reeds bestaande `powerhouse-content-orchestrator` binnen dezelfde content-loop-lease. Geen nieuw proces, geen tweede publisher, geen oude/verzonnen ervaring, geen duplicaat of handmatige `LIVE_PROVEN`-mutatie.

Een na bronherstel mislukte AI-tekstgeneratie (bijv. provider `HTTP429 insufficient_quota`) blijft een **aparte** fout met originele retry/cooldown en financierings-/providerwaarheid; nooit als een persoonlijke post presenteren. Oorspronkelijke eindredactie, exact final-text-hash/identity review en onafhankelijke LinkedIn provider-ID plus readback blijven verplicht. Regressie: `tests/brain-personal-late-user-fact-rebootstrap-20261118.test.mjs`.

Fingerprint: `personal-linkedin-personal-life-only-v1`.

## Hard rule

Arthur's personal LinkedIn is exclusively for personal life and lived personal observations. It must not contain company, client, MKB, consultancy, assignment, business-process, organizational AI/digitalization, Bedrijfsgeheugen, sales, lead, offer, case, thought-leadership or business-lesson content.

A personal anecdote may never be used as a wrapper or bridge to a business message.

## Allowed source worlds

Family and parenting; children and school; hockey/sport; travel/holiday; car/transport; home/garden; consumer technology; shopping/daily services; family/generations; leisure; daily routines/frustrations; ordinary human observations.

## Source rules

External trends, search data, forums or news may suggest personal themes but may never invent an Arthur experience. First-person claims require verified personal source lineage.

## Fail-closed publication gate

Before publication require:
- exact personal channel identity;
- verified first-person source;
- concrete lived personal event in final copy;
- `personalLifeOnlyVerified=true`;
- no business/corporate/consultant signal;
- no forced business moral;
- copy not interchangeable with the company page.

Business exceptions are not allowed. If a topic is business-oriented, route it to LinkedIn company or rewrite from a genuinely personal topic.

## Learning

Keep personal-profile performance separate from company-page performance. Optimize personal LinkedIn for recognition, humor, conversation and personal engagement, not commercial conversion.


## Provider capability proof (2026-09-22)

Fingerprint: `linkedin-composio-capability-proof-v1`.

- A LinkedIn connection in an external dashboard is not sufficient publication evidence. Powerhouse must read the active provider connection itself.
- Personal posting identity must be resolved through the authenticated LinkedIn member identity before any provider side effect.
- Company-page posting capability must be proven separately from personal capability; do not infer organization permissions from a personal connection.
- Capability discovery is read-only and runs before the canonical social publisher. The publisher remains the sole writer and all existing personal-truth, daily-channel and dedupe gates remain mandatory.


## Personal source rotation no-gap rule (2026-09-27)

Fingerprint: `personal-source-rotation-no-gap-v1`.

Personal LinkedIn may never invent a daily-life event merely to satisfy a publishing cadence. If today's verified source pool is empty:
- first use an unused verified non-sensitive personal source;
- if all verified sources have been used before, select the least-recently-used verified non-sensitive source;
- generate a fully new angle and wording from that factual source;
- verbatim reuse, copied sentences, new facts, business bridges and management morals remain forbidden;
- global final-text/story dedupe still applies;
- the fallback remains a personal-life post, never company-page content.

This rotation prevents an exhausted source pool from silently turning the daily channel into `PERSONAL_TRUTH_SOURCE_UNVERIFIED` while preserving truth and uniqueness.

## Concrete subject / example reuse is forbidden (2026-09-28)

Fingerprint: `personal-linkedin-semantic-example-uniqueness-v1`.

A personal post may not reuse an underlying concrete subject, incident, example, anecdote or story family that has already been published, even when the wording, hook, conclusion or source text is different.

Hard rules:
- historical uniqueness is semantic, not merely textual;
- a previously published concrete example is permanently consumed for personal LinkedIn;
- when a candidate overlaps a previously used story family, discard it and select a genuinely different verified personal source;
- never rotate back to a least-recently-used source once it has been published;
- if the verified unused source pool is exhausted, do not recycle old examples to satisfy cadence; source a different verified personal-life event first;
- changing synonyms, structure, CTA, tone or lesson never makes the same example new;
- the known `printer` story family is consumed and must not be published again.

This rule is stricter than text-hash/shingle dedupe and overrides the older rotation wording wherever that could be read as allowing reuse of a previously published source.



## Source-backed topic selection — 2026-09-29
Fingerprint: `powerhouse-source-backed-all-channels-v1`.

Public daily-life/friction evidence may determine which personal-life topic is worth writing about, but it is never proof that Arthur personally experienced it. First-person claims still require verified Arthur source truth. If no verified personal anchor exists, write observationally without inventing experience, or hold the item. Always retain source lineage, dedupe historically, and write engagement/inbound outcomes back to the source/problem/angle.

## Personal LinkedIn story-family overlap guard v2 (2026-09-30)

Fingerprint: `personal-linkedin-story-family-overlap-v2`.

A verified personal source can be factually true and still be ineligible because its underlying story was already consumed. For personal LinkedIn:
- a published anecdote is permanently consumed as a story family;
- source rotation may never return to an already-published anecdote;
- same objects + same event + same lived sequence + same conclusion/routine count as the same story even when phrasing is new;
- the database story-family overlap gate is mandatory before provider write;
- on `STORY_FAMILY_DUPLICATE`, choose a different verified personal event rather than paraphrasing.

Canonical regression family now also includes the car incident: broken electric sliding door, warm airco, manual door/windows-open workaround and adaptation to the new routine.


## Daily no-gap observational fallback — 2026-10-03

Fingerprint: `personal-linkedin-no-gap-observational-v2`.

Daily cadence may never be satisfied by recycling a historical personal anecdote. Historical generated artifacts are not an eligible fallback source because they can inherit an already-consumed story family.

When no genuinely unused verified Arthur personal event is available:
- select a fresh, source-backed everyday-life theme that has not previously been used on the personal channel;
- write observationally, with no `ik/mijn/mij/me` claims and no implication that Arthur personally experienced the event;
- keep the topic strictly daily-life/personal and non-commercial;
- preserve source URL, source lineage, calendar date and prediction lineage;
- run the same global text/story-family uniqueness gate before provider write;
- never accept `NO_ELIGIBLE_CONTENT` / `SKIPPED` as a successful terminal outcome for the daily personal-channel obligation while a compliant observational source exists.

LinkedIn account resolution must prefer the canonical personal connection independently of company/org connections. A revoked or organization-oriented active token may not become the personal publication authority merely because it resolves the same member identity.

## 15 november 2026 — bindende echte ik-verhalen, geen nieuwsfallback

Fingerprint: `powerhouse|personal-linkedin|true-user-story-vs-company|20261115-v1`.

Deze regel vervangt iedere oudere no-gap-rotatie, observerende nieuwsbronfallback, AI-founder-/business-exceptie of automatische herpublicatie van het vorige concrete voorbeeld. `linkedin_personal` publiceert **alleen** een eerstehands, echt door Arthur aangeleverde of persoonlijk bevestigde ervaring, met de originele user-fact-lineage en expliciet `personal_truth_verified`, `arthur_anchor_verified` en `first_person_claims_verified`. Geen fictieve eigen emoties, uitspraken, tijden, gezinsdetails, ontmoetingen of uitkomsten. Niet vrijgegeven privé-informatie blijft niet-publiceerbaar.

De post is vanuit **IK** geschreven en heeft een concrete menselijke gebeurtenis, onverwachte wending/escalatie, lichte humor of zelfspot en een natuurlijke pointe. Geen zakelijke brug, klanten, ondernemerstaal, Bedrijfsgeheugen, AI, sales, links, hashtags of emoji. De stijlreferentie is een herkenbare alledaagse frustratie met korte zinnen, geen managementles. Afwisselende werkelijk bevestigde verhalen uit dagelijks leven, reizen, sport, huis, technologie; niet steeds hockey. Printer-, auto- en vleermuisverhaal zijn verbruikt, nooit opnieuw verpakken.

De persoonlijke publicatiekalender is maandag t/m zaterdag; zondag is geen publicatiedag. Geen bron op de juiste dag betekent `PERSONAL_USER_EXPERIENCE_NOT_VERIFIED` met originele eigenaar, nieuwe bronverwervingsactie en ONE BRAIN bewijs, **niet** een fictieve post of bedrijfsfallback. De bestaande #140-executor blijft actief. Bronstatus wordt in de originele database opnieuw opgehaald bij de eindredactie en direct vóór de provider-call; `skipped`, ingetrokken, in quarantaine of gewijzigde brontekst kan niet worden gepubliceerd. Als de provider al een URN gaf, behoud `republish_forbidden=true` en verzend niet opnieuw.

Nieuwe code: `supabase/functions/_shared/personal-first-person-story-gate.mjs`. De originele orchestrator, onafhankelijke `bg-pre-publish-review` en `powerhouse-social-publisher` voeren dezelfde guard uit. Testroute: `tests/brain-personal-first-person-voice-and-source-20261115.test.mjs`. Terminal: protected Required/CodeQL/Supabase Preview, main, Edge parity, echte providerreadback, ONE BRAIN overdracht, Heartbeat. Geen nieuw systeem.

## Incident #5913 — publish never from rejected observation; exact last-metre gate

Observed 2026-11-15: external news about a tasered package courier was generated and registered under Arthur's personal account despite existing story rules. A 422 `OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED` and mismatched reviewed/final hashes coexisted with published/LIVE_PROVEN registers. This must never be converted into an editorial PASS by view counts or a later provider readback.

**Effective rule superseding every older observational fallback above:** no editorial or transport route may publish public news, trend/source-radar observations, a business-style founder status update, a synthetic Arthur anecdote, or unconfirmed private details as personal content. Only original, accepted and still-current user-authored first-person lived-event sources can qualify. The final actual commentary must have an independent reviewer HTTP 200/PASS against the **same SHA-256** and current source revision, then pass the separate last-metre `personalLastMilePublicationViolations` check within the sole original Composio sender immediately before the provider write. Missing proof, HTTP 422, source mismatch, Sunday, stale approval and text mutation all mean **no provider write**, but an open original obligation with owner/next action. Do not disable the executor or start a backup scheduler; do not duplicate an existing provider URN.

Company content stays on the company page. Engagement is a measurement, not permission to violate identity. Persist root cause, failure chronology, test/commit/release/readback evidence and the preventive rule in ONE BRAIN and the original incident lineage. Test authority: `tests/brain-personal-first-person-voice-and-source-20261115.test.mjs`. The change is not called LIVE or GREEN until protected tests, actual production release, source parity and a negative production review are verified.


## 16 november 2026 — bronfout niet als OAuth-fout behandelen

Fingerprint: `powerhouse|linkedin-personal|truth-source-misrouted-as-oauth|20261116-v1`.

Bij een persoonlijke `hold/blocked`-beslissing met `capability_reason=PERSONAL_TRUTH_SOURCE_UNVERIFIED`, `NO_UNIQUE_VERIFIED_PERSONAL_SOURCE`, `PERSONAL_SOURCE_UNVERIFIED` of `PERSONAL_USER_EXPERIENCE_NOT_VERIFIED` is de oorzaak **niet** automatisch providerautorisatie. De enige originele bron-/redactie-eigenaar controleert eerst of een ongebruikte, door Arthur zelf aangeleverde of expliciet bevestigde echte eigen gebeurtenis bestaat; zo niet, blijft dezelfde dagverplichting OPEN en is een concrete feitelijke bronbevestiging noodzakelijk. Geen fictieve eigen ervaring, gescrapet nieuws, observerende fallback, automatisch gebouwd founder-dashboardverhaal, zakelijke content, zondagspost of het omzeilen van de reviewer.

De bestaande `powerhouse-content-loop` routeert dit uitsluitend als `PERSONAL_SOURCE_PROOF_REQUIRED` met `VERIFY_ORIGINAL_FOUNDER_SOURCE_THEN_REGENERATE`. OAuth mag alleen als probleem worden genoemd wanneer onafhankelijke actuele connectorbewijsvoering dat werkelijk aantoont. Dezelfde originele providerwriter en unieke dagclaim blijven leidend; behoud de originele eigenaar, bronrevisie, quality PASS op exact finale teksthash en provider-ID. Geen tweede sender, cron of retry bij onzekere provider-side-effecten. De preflight meldt `SOURCE_EDITORIAL_REVISION_REQUIRED` vóór de deadline. Een geslaagde classificatie is geen gepubliceerde post.

Regressie: `tests/brain-personal-source-not-oauth-routing-20261116.test.mjs`. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5913. Een volledig groene status vereist release-pariteit en de eerstvolgende daadwerkelijke origineel-uitgevoerde proef inclusief providerbewijs en ONE BRAIN PROCESSED; ontbrekende verifieerbare gebeurtenis betekent niet gepubliceerd, niet groen.


## 16 november 2026 — ook de bronproducent mag nooit zakelijk zijn

Fingerprint: `personal-linkedin|old-founder-source-producer-conflicts-with-lifestyle-only|20261116-v1`.

De oorspronkelijke productie-readback toonde twaalf **actieve** persoonlijke `bg_schrijfregels` uit 7 oktober die nog een dagelijkse Bedrijfsgeheugen-/AI-founder-reis voorschreven. De native `powerhouse_materialize_source_backed_channel_candidates_v2` genereerde opnieuw een `daily-dream-journey` met `business_topic=true`, `personal_life_topic=false`, terwijl er nul geverifieerde persoonlijke bronnen waren. De verplichte regel is uitsluitend persoonlijke gebeurtenissen; zakelijke inhoud moet naar de bestaande bedrijfsredactie, niet in het persoonlijke dagrecord.

De beschermde bronwijziging `supabase/migrations/20261116110100_personal_linkedin_life_only_producer_v1.sql` zet exact deze 12 oude tegenstrijdige regels op `vervallen`, stelt één moderne persoonlijke leven-/ik-bronregel `actief` en stopt de AI-native-business-kandidaat in de oorspronkelijke v2-materializer; resterende oude suggesties worden `skipped` met `PERSONAL_BUSINESS_SOURCE_FORBIDDEN`. De oorspronkelijke v1 materialisatie voor alle kanalen, autorisatie en aparte bedrijfspost blijven intact. Het woord 'persoonlijk' is geen toestemming om willekeurige gebeurtenissen uit gesprekken, privépersonen of gezondheids-/familiegegevens te publiceren. Alleen exact traceerbare door Arthur zelf vertelde of bevestigde niet-gevoelige feiten, met privétoestemming indien nodig, kunnen na ongebruikte story-family-controle tot een concept leiden. Geen bron betekent OPEN en de bestaande bronagent draagt het voort; geen fictieve `ik`, ongefundeerde observatiefallback, verborgen zakelijke les, provider-retry of dubbele verzending.

Regression: `tests/brain-personal-life-only-editorial-producer-20261116.test.mjs`. Audit: `docs/changes/2026-11-16-personal-life-only-editorial-source-repair.md` en oorspronkelijke incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5913. Technisch geen LIVE vóór protected Required+CodeQL+Supabase Preview, beschermde merge, native statuscontrole op `bg_schrijfregels`, origineel provider/source-ID readback. Persoonlijke post blijft niet-gepubliceerd tot een echte persoonlijke bron en onafhankelijke eindtekst-PASS aantoonbaar zijn.

## 16 november 2026 — creatieve leerengine mag geen B2B-recepten voor persoonlijk maken

Fingerprint: `powerhouse|linkedin-personal|creative-commercial-contamination|20261116-v1`.
De oudere `brain/creative/revenue-content-intelligence.mjs` en `config/social-learning-engine.json` droegen nog een `observational_business_standup` met `commercial_conversation`, lead-discovery, FOMO en offertebrug als standaard voor `linkedin_personal`. Deze oude marketing-instructies zijn **niet** bruikbaar als persoonlijke copy en verliezen altijd van `personal-linkedin-personal-life-only-v1`.

Bij persoonlijke experimenten: gebruik uitsluitend een echte, nog niet gebruikte en expliciet vrijgegeven ik-gebeurtenis met concrete menselijke details. Zakelijke kansen, bronnen, marketingfunnels, privéchats zonder publicatietoestemming en nieuws vormen geen vervangende bron. Zonder geschikte persoonlijke bron: bestaande verplichting OPEN met bronactie, geen gekunstelde 130–200 woorden, geen herhaling, geen tweede sender en geen fictie.

Meet per persoonlijke post inhoudelijke reacties, gesprekken, delen en profielbetrokkenheid binnen daadwerkelijk beschikbare onafhankelijke providerdata. Scheid dit strikt van bedrijfsleads/omzet; een paar reacties zonder impressies, comments of vergelijkbare historie is **geen** bewijs voor een winnend format. Alleen bewezen leereffect in de volgende originele contentkeuze geeft `LEARNING_APPLIED`. Deze leerengine maakt alleen conceptrecepten; bron-, identiteits-, privacy-, exacte SHA- en provider-gates blijven de enige publicatieautoriteit.

## 16 november 2026 — declutter complexity: inhoud bepaalt de vorm

Fingerprint: `personal-linkedin|source-first-style-variation|20261116-v1`.

Bindend en boven oudere verplichtingen tot een onverwachte wending, humor, een vast aantal woorden, een opener of slotvraag: **een echt persoonlijk voorval bepaalt zelf de vorm**. Een persoonlijk verhaal hoeft niet grappig, leerzaam, ontroerend of interactief te zijn. Schrijf normaal, vanuit Arthur, kort waar mogelijk; schrap alle woorden die geen nieuwe gebeurtenis, menselijke nuance of herkenbare gedachte toevoegen. Geen management- of AI-toon, verkoop of geforceerde engagement-vraag.

Vóór de bestaande onafhankelijke eindredactie moet de redactie de laatste persoonlijke posts vergelijken op **openingsvorm, vertelstructuur, lengte, emotie/humor en afsluiting**, naast de bestaande feitelijke source- en story-family-dedupe. Niet twee keer dezelfde formule met andere objecten: bij mechanische gelijkenis `REWRITE_NOT_PUBLISH`, met dezelfde geverifieerde feiten, zonder nieuwe privéclaims of het opnieuw publiceren van reeds verbruikte gebeurtenissen. Variatie is bron-gedreven, nooit willekeurige afwisseling van voorgeschreven comedy-, emotie- of CTA-sjablonen.

Dit is een redactionele norm voor de bestaande keten en **geen zelfstandige publish-authorisatie**. Alleen de originele providerwriter na exacte bron-/hash-/privacy-/weekdagcontrole mag posten. Bron ontbreekt of gate faalt: oorspronkelijke verplichting OPEN en herstel/terugkoppeling; niet automatisch groen verklaren. Test: `tests/brain-personal-creative-learning-20261116.test.mjs`.

## Extern onderbouwde individuele redactie — 16 november 2026

Fingerprint: `personal-linkedin|real-story-research-guard-v1`.

Evidence: LinkedIn zelf (https://news.linkedin.com/2026/ImprovingTheFeed en https://news.linkedin.com/2026/authentic-content-and-conversations), Flypost-vergelijking van 116.000+ posts (13 okt 2026; https://www.flypost.io/learn/linkedin-algorithm-study-data) en Metricool (14 apr 2026; https://metricool.com/linkedin-trends-study/). Dit zijn geen Arthur-specifieke causale feiten. De onafhankelijke onderzoeken spreken elkaar over vragen soms tegen: daarom **NOOIT** een vaste vraag-, openings-, lengte-, grap-, foto- of frequentieformule invoeren.

De bestaande originele redactie beslist autonoom op basis van bron en kwaliteit. Dezelfde originele prepublish-review haalt relevante echte eerdere persoonlijke post-teksten op, controleert laatste 45 dagen op herhaalde herkenbare openingsframes, identieke slotgedachten en repetitieve vertelmarkers, en geeft bij overlap een duidelijke herformuleringsreden. Herformuleer uitsluitend met al geverifieerde feiten, geen kunstmatig nieuw voorval of zakelijke brug; story-family semantische dedupe blijft strenger. Zonder actuele database-readback blijft de review dicht: `PERSONAL_EDITORIAL_HISTORY_UNAVAILABLE`.

De oorspronkelijke persoonlijke bron, privacy, bronrevisie, exacte eindteksthash, zondagrule, reviewer PASS en bestaande providerwriter zijn ongewijzigde verplichte gates. Een echte foto mag alleen met bron-/beeldrechten en privacyvrijgave, niet als contenttruc. Nooit geautomatiseerde comments, scraping, pods of kunstmatige interactie. Lees eigen persoonlijkprofiel-metrics alleen via geautoriseerde providerreadback, geen schatting van impressies uit likes. Leer na 24/48/72 uur waar echte metingen beschikbaar zijn; geen winnende vorm afkondigen zonder vergelijkbare gegevens en voldoende voorbeelden. Geen nieuwe scheduling, geen duplicaatpost.

## 18 november 2026 — OpenAI API-billing versus betaalde accounts, proactief escaleren

Het originele persoonlijke LinkedIn-artifact had op 18 november wel een echt door de gebruiker aangeleverd bronsignaal en `decision=publish`, maar de goedgekeurde tekstgenerator `gpt-5-mini` gaf `HTTP429 insufficient_quota / PROVIDER_BILLING`, met originele cooldown in `powerhouse_channel_decisions.delivery_evidence.artifact_generation_failure`. Geen providerpost-ID, dus **geen post live**, ook niet als cron of beslisagent groen oogt.

De eigenaar geeft aan dat OpenAI betaald is. Formuleer bij `429 insufficient_quota` daarom **niet** automatisch dat facturen onbetaald zijn of dat iemand direct opnieuw moet betalen: onderzoek het gebruikte API-organisatie-/projectbudget, de gekoppelde API-sleutel, bestedingslimiet en specifieke API-credits. ChatGPT-abonnement, API-organisatie en projectbestedingslimiet zijn gescheiden autorisatie- en capaciteitsgrenzen. Alleen de bevoegde eigenaar mag facturatie of governancestatus wijzigen.

Het oorspronkelijke `#171`-resultaat vult `owner_action_due` en één brongebonden `owner_action_required` per dag, met `notification_sent=false`; de al bestaande eigenaarstaken moeten de melding aantoonbaar aan de gebruiker bezorgen of `PENDING_VERIFIED_OWNER_NOTIFICATION` behouden. Bij afgebroken meettaak moet de bestaande Daily Publisher dezelfde actuele fout melden; nooit eindeloos opnieuw genereren in cooldown, generieke privéfeitjes verzinnen, een `SUSPENDED` model zelf activeren of een persoonlijke LinkedIn-post als `LIVE_PROVEN` markeren zonder exacte provider-URN en onafhankelijke readback. De oorspronkelijke persoonlijke publicatie-executor blijft aan, tenzij een externe toestemming echt vereist is. Incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198; regressie `tests/brain-original-provider-owner-notification-20261118.test.mjs`.

## 18 november 2026 — betaald OpenAI-project: last-error ≠ current-API health
De eigenaar bevestigt positief API-tegoed in OpenAI Platform en een betaald account. De oorspronkelijke persoonlijke LinkedIn-generatie kreeg `gpt-5-mini` `429 insufficient_quota` om 14:59 UTC, maar de foutregel kan later worden uitgelezen zonder dat de oorspronkelijke generatie opnieuw is uitgevoerd. **Oude 429 is historische foutinformatie, geen zelfstandig bewijs dat de huidige API-organisatie, sleutel of project vandaag leeg is.** Gebruik de bestaande door governance goedgekeurde `OPENAI_API_KEY` via de oorspronkelijke Supabase-kluis en dezelfde oorspronkelijke content-orchestrator, pas na `artifact_generation_failure.retry_after` en met 1 bounded approved attempt als native eigenaar. Een geslaagd GPT-antwoord bij een andere verbinding is geen succesvolle persoonlijke content/artifact-providerreadback.

Voordat eigenaren een accountactie vragen: eerst dezelfde oorspronkelijke API-scope/limieten/tenant-match en echte laatste providercode onafhankelijk controleren, zonder secrets uit te lezen of te tonen en zonder ongeautoriseerde sleutels, extra credits, contractwijzigingen of opheffing van geschorste AI-modelgovernance. Zonder exacte teksthash, unieke persoonlijke situatie, oorspronkelijke kwaliteitsreview, LinkedIn-URN, provider readback, heartbeat en leerbewijs blijft de persoonlijke post `PLANNED/UNVERIFIED`. Laat de executor doorgaan met andere veilige taken. De #171-alert moet `last_failed_at` en `retry_after` onderscheiden en eigenaarmelding niet als geleverd beschouwen bij louter database-event. Incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## 18 november 2026 — persoonlijke dweilrobot-zoektocht, finale 422 zonder publicatie

De oorspronkelijke redactie kreeg op 18 november na de OpenAI-kredietcooldown een echte gpt-5-mini-`content_ready` tekst op basis van de door de gebruiker zelf besproken dweilrobot met water-/afvoeraansluiting. De post claimt geen koop of gebruik. De onafhankelijke final reviewer wees hem af met `FINAL_TEXT_CONCRETE_PERSONAL_EVENT_REQUIRED` uitsluitend omdat de huiselijke woorden `dweilrobot`, `waterleiding`, `afvoer` niet in de bestaande contextwoordenlijst stonden; de tekst bevat wel `Ik zocht` en is concreet. Breid niet de persoonlijke waarheidsnorm af: échte eerste persoon én concreet eigen handelen én dagelijks onderwerp blijven vereist, de onafhankelijke reviewer blijft beslissen.

De bestaande #140 content-loop moet iedere nog niet gepubliceerde exact 422 van de huidige dag kunnen laten HERBEOORDELEN via de bestaande oorspronkelijke editor, maar alleen wanneer beslissing en verplichting hetzelfde bron-id, exact reviewer-texthash en 422-code dragen, geverifieerde directe gebruikersbron/lineage is aanwezig, er geen provider-ID/ambiguous side effect bestaat, de oorspronkelijke publicatieautoriteit ongebruikt is en er nog minder dan drie herstelpogingen waren. Nooit een nieuwe agent, connector, scheduler, providerpost of handmatige downgrade van REVIEW BLOCKED naar gepost.

Registratie + regressie: `tests/brain-personal-dweilrobot-review-rebootstrap-20261118.test.mjs`, `brain/learning/2026-11-18-personal-dweilrobot-review-rebootstrap-v1.json`, oorspronkelijke issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Pas `LIVE_PROVEN` na werkelijk LinkedIn-URN, juiste auteur, exacte tekst en onafhankelijke readback; de concrete bron is geen verzendbewijs.
