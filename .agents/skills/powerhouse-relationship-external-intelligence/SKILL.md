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


## P0 original handoff observability, CRO analysis, controlled experiments — 2026-11-09
De **bestaande** `powerhouse_commercial_action_closure_watchdog_v1` legt na iedere natuurlijke run in dezelfde `bg_gezondheid`-registratie een `handoff_measurement` vast. Cohort is e-mailactie aangemaakt in de afgelopen zeven dagen, niet het aantal cron-runs. Aan elke originele `action_id` worden research-dedupe, exact persoon+bedrijf, laatste composer-quality, immutable provider-ID/readback, replies en afsluitredenen gekoppeld. Op nul externe acties: `NO_EMAIL_ACTION_ELIGIBLE`, nooit fictief commercieel resultaat.
De bestaande analist classificeert oorzaken per overgang, bewaakt het aantal verlopen acties met reeds afgerond onderzoek, analyseert wekelijks conversies en opgelopen uitval in het cohort, en kiest verbetering bij de eerste uitval. De bestaande Growth-eigenaar voert een aanpassing pas uit onder dezelfde protected PR en behoudt de oorspronkelijke executor. Geen afzonderlijke monitor, database, eventloop of scheduler.
Experimenteer met de bestaande `powerhouse_experiment_policies` en `powerhouse_experiment_assignments`, in dezelfde person/action-lineage. Gebruik treatment/holdout; een holdout mag niet onbedoeld toch outbound ontvangen. Niet meer dan één assignment per subject+test volgens bestaande unieke identiteit. Controleer policy-status en `min_matured_per_arm` en meet uitkomsten per arm binnen dezelfde observation window. Geen conclusie `LEARNED` zonder voldoende afgeronde echte uitkomsten. Bij alleen intern 'done', alleen drafts, lege treatment/holdout of nul provider-receipts blijft status `INSUFFICIENT_EVIDENCE_NOT_LEARNED`. Klinisch/causaal effect is nooit af te leiden uit enkel engagement.
Incident: oorspronkelijke ONE BRAIN `p0-20261109-commercial-research-composer-handoff`. Regressie: `tests/brain-verified-research-composer-handoff-20261109.test.mjs`. Productiereadback vereist. Geen claim dat nieuwe metrics al live zijn voordat protected merge + daadwerkelijke bron/migratie + bestaande runtime-meting worden teruggelezen.


## P0: één meetbare overdracht, analytische diagnose en gecontroleerde experimenten
Elke bestaande `autonomous_email` behoudt dezelfde `action_id` vanaf research tot composer, provider-ID, onafhankelijk berichtreadback, reply en echte omzet. De bestaande `powerhouse_email_execution_watchdog_v1` leest op elke **natuurlijke bestaande run** de beveiligde zeven-dagen-scorecard `powerhouse_commercial_handoff_scorecard_v1`; geen extra cron. De onderliggende `powerhouse_commercial_handoff_telemetry_v1` classificeert de oorspronkelijke per-actie-overdrachten en signaleert verlopen onderzoek, onderzoek→composer (>60 minuten na afgerond onderzoek), composer→provider (>30 minuten na geslaagde kwaliteit), ontbrekend provider-ID/readback en ontbrekende terminale uitkomst.
**Definition of done:** `provider_delivery_proven` vereist een geregistreerd geldig bericht-ID, provider ACK en provider-readback; het is nooit gelijk aan een interne `done` of een groen uurproces. Werkelijke reacties en omzet worden alleen aan dezelfde oorspronkelijk bewezen provideractie gekoppeld. De twee beveiligde views zijn `security_invoker` en alleen toegankelijk voor `service_role`; ze geven geen e-mailadressen of berichtinhoud vrij. Een gezondheidsmeting die faalt blijft `MEASUREMENT_FAILED` en nooit groen.
**Analist:** gebruik per 24 uur en 7 dagen aantallen, overdrachtspercentages (met teller/noemer), mediane latency, uitvaloorzaak, ouderdom van acties, bronkwaliteit, reply→meeting→betaalde omzet en privacy/druk-/opt-outsignalen. Prioriteer de **grootste werkelijk geobserveerde lekkage** voor herstel; herhaal de volgende natuurlijke run en leg voor/na aan dezelfde actie vast.
**CRO/Innovatie:** bestaande `powerhouse_experiment_policies`, `powerhouse_experiment_assignments` en `powerhouse_cro_experiment_evidence_v1` zijn de enige experimenteer-autoriteit. Alleen prospectieve, voor eligibility gecontroleerde, immutable treatment/holdout-toewijzingen. Verander nooit een contactdruk-, privacy-, kwaliteits- of provi­der-eis om samplegrootte te krijgen. Geen winnaar zolang de vereiste volwassen steekproef per arm, valide uitkomsten, anti-contaminatie en attributie ontbreken: rapporteer `INSUFFICIENT_EVIDENCE`. Metrieken zonder A/B-controlegroep zijn observationeel en mogen niet als causale uplift worden gepresenteerd.
