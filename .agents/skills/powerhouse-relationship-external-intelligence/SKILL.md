# Skill: Powerhouse Relationship External Intelligence

Fingerprint: `powerhouse-relationship-external-intelligence-v1`

## Permanente regel
Publiek beschikbare en rechtmatig verkregen externe updates over een bestaande connectie, klant of gekoppeld bedrijf worden standaard als evidence aan de canonieke relatiegraph gekoppeld. Dit omvat bedrijfsnieuws, website/newsroom, vacatures, marktontwikkelingen en LinkedIn-context voor zover die via ondersteunde bronnen/capabilities beschikbaar is.

## Canonieke lineage
`external/public evidence -> runtime event -> person -> company -> customer -> opportunity/NBA -> action/outcome -> learning`.

Geen los nieuwsarchief als eindpunt. Een relevant signaal moet terugkomen in de context die Powerhouse gebruikt voor scoring, timing, kanaalkeuze en next-best-action.

## Beslisregels
- Extern signaal is evidence, niet automatisch koopintentie.
- Match eerst op persoon/bedrijf en provenance; daarna pas scoring.
- Freshness, source trust, corroboration en confidence blijven zichtbaar.
- Geen gevoelige persoonsinferenties of afleiding van bijzondere persoonsgegevens.
- Geen scraping/platform-bypass; LinkedIn alleen via toegestane publieke/provider-capabilities.
- Customer linkage gebruikt de bestaande klant- en company-lineage; geen parallel CRM.
- Opportunity/NBA mag alleen wijzigen via bestaande evidence-, fatigue-, suppression- en outcome-gates.
- Alle downstream acties blijven dedupe-, identity- en provider-ack gebonden.

## Runtime
- Projector: `public.powerhouse_refresh_relationship_external_intelligence_v1(date)`.
- Context view: `public.powerhouse_relationship_context_enriched_v1`.
- Scheduler owner: uitsluitend `powerhouse-commercial-learning-v1`.
- Volgorde: external intelligence projection -> relationship scoring -> research -> trigger/opportunity -> Growth Swarm/NBA -> execution -> learning.

## Doel
Powerhouse moet bij iedere relevante connectie/klant/bedrijf weten wat er extern veranderd is en dit gebruiken om betere commerciële beslissingen te nemen, zonder losse datasilo's of vendor-afhankelijkheid.


## Daily full connection enrichment
Gebruik permanent `powerhouse-daily-full-connection-enrichment-v1`. Iedere canonieke connectie wordt iedere kalenderdag opnieuw verrijkt met alle reeds ingeladen relevante LinkedIn-, bedrijfs-, publieke web-, runtime-, opportunity- en outcome-evidence. De full-graph refresh draait set-based binnen de bestaande `powerhouse-commercial-learning-v1` scheduler. Gedetailleerde evidence blijft in de canonieke bronstores; de dagelijkse enrichment-state is een rollup/provenance-laag en geen parallel CRM. Nieuwe evidence die later op de dag binnenkomt wordt bij de volgende bestaande commerciële cyclus opnieuw op de volledige graph geprojecteerd.

## P0 invariant: research is pas klaar na consumer-readback
Bij `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` van een bestaande `autonomous_email`:
1. Voer via het bestaande `relationship-research:outreach-source:<action-id>` record de reeds toegestane publieke research uit. Dedupe en oorspronkelijke actie-ID blijven gelijk.
2. Een `research_enrichment` met `status=done` is uitsluitend een interne onderzoeksuitkomst. Het bewijst geen vrijgegeven bericht, verstuurde mail, antwoord, afspraak of omzet.
3. De oorspronkelijke composer leest vóór elke herbeoordeling de onderzoeksactie én het door `bg_bedrijfsnieuws` geaccepteerde, actuele bedrijfsspecifieke bronrecord. Alleen bij sluitende persoon-, bedrijf-, bron- en tijdsmatch mag dat specifieke feit als context worden gebruikt. SERP-kandidaten, ontbrekende bronvalidatie en uitgestelde research blijven geblokkeerd.
4. De originele composer voert daarna alle inhouds- en bronkwaliteitscontroles opnieuw uit. Verzending blijft uitsluitend bij de bestaande executor na recipient authority, suppressions, fatigue, dedupe en onafhankelijke provider-ID/readback.
5. Meet dagelijks de volledige keten: `eligible -> researched -> sourced -> composer_passed -> provider_accepted -> answered -> meeting -> order -> realized_revenue`. Zet de eindstatus nooit groen op basis van een cron-succes, een interne actie `done`, een concept, of een modelscore. Bij nul toegestane externe acties rapporteer `NO_ELIGIBLE_ACTION`, niet kunstmatig succes.
6. CRO en Innovatie mogen een aanpak pas `LEARNED` noemen na gekoppelde echte uitkomsten met een valide experiment-/holdoutopzet of na expliciet gemarkeerde observationele onzekerheid. Onvoldoende steekproef blijft `INSUFFICIENT_EVIDENCE`.
7. Storingen loggen met exacte action-ID en originele onderzoeks-dedupe, ontbrekende voorwaarde, eigenaar, herstelaanpak, regressietest en nieuwe productiereadback in dezelfde ONE BRAIN lineage. Nooit een tweede scheduler of parallel e-mailsysteem.


## P0: bounded lifecycle and exclusive resume authority
De bestaande `powerhouse_commercial_action_closure_watchdog_v1` bewaart een aantoonbaar `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`-geblokkeerde `autonomous_email` met geldige interne onderzoeksactie maximaal 48 uur in `waiting`, in plaats van hem na zes uur te laten vervallen. De bestaande `powerhouse_email_execution_watchdog_v1` mag dit type wachtactie niet als providerretry terugzetten naar `prepared`. Uitsluitend de oorspronkelijke `powerhouse-commercial-message-composer` mag `waiting -> prepared` uitvoeren na sluitende bron-herkomst, frisse bedrijfsbron en geslaagde volledige kwaliteitscontrole. Zonder bewijs blijft wachten of gecontroleerd afsluiten; nooit verzenden. Deze overgang telt niet als provider-ACK, reply of omzet. Regressie: `tests/brain-verified-research-composer-handoff-20261109.test.mjs`.
