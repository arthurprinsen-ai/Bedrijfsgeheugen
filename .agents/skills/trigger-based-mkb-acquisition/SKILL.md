# Skill: Trigger-based MKB Acquisition

Fingerprint: `powerhouse-trigger-based-mkb-acquisition-v1`

## Wanneer gebruiken
Gebruik deze skill bij leadgeneratie, markt-/bedrijfssignalering, commerciële opportunity scoring, partnerdistributie, content-to-revenue, Frisse Blik, scanverkoop en next-best-action voor Bedrijfsgeheugen.

## Verplicht patroon
1. Lees eerst bestaande Commercial Graph, opportunities, forecasts, actions/outcomes en relevante relationship state.
2. Zoek een observeerbare kooptrigger; verzin geen aanleiding.
3. Bewaar evidence-ref, datum/freshness, provenance en confidence.
4. Vorm expliciet een `problem_hypothesis`, nooit als feit formuleren.
5. Bepaal economische relevantie en waarschijnlijk beslissersrol.
6. Kies de kleinste relevante vervolgstap: content, insight, Frisse Blik, benchmark, gesprek, partnerintro of scan.
7. Gebruik geen generieke bulk-cold outreach als default.
8. Dedupe kanaal/contactdag en respecteer suppression/fatigue.
9. Log actie en outcome in bestaande canonical lineage.
10. Kalibreer scoring en vervolgstap op observed outcomes.
11. Projecteer learnings terug naar docs/skills/System Map wanneer gedrag structureel verandert.

## Triggerbibliotheek
- groei
- nieuwe directie
- koop/verkoop/M&A
- investeerder/PE
- integratie
- ERP/AFAS/bedrijfsapplicatie verandering
- marge/kosten/cashflow
- personeelstekort/key-person risk
- regelgeving
- financiering
- turnaround/reorganisatie
- AI/data/digitaliseringsinitiatief

## Funnel
`external data -> verified trigger -> problem hypothesis -> relevant content/outreach -> gratis Frisse Blik (30 min) -> gekwalificeerd gesprek -> betaald instapaanbod (Directie & AI Workshop €1.950 of Bedrijfsgeheugen Scan €2.950, conform actuele prijzenpagina) -> implementatie -> portal/SaaS -> onafhankelijk geverifieerde order/omzet -> gerealiseerde uitkomst -> learning/referral`.

## Partner-first waar voordelig
Beoordeel accountants, M&A, PE/investeerders, banken, gemeenten, brancheverenigingen, ERP/AFAS-partners, MSP/IT-partners en bedrijfsadviseurs als leverage-route.

## Fail-closed
Stop commerciële execution wanneer:
- evidence ontbreekt of stale is;
- identiteit/beslisser onzeker is;
- actie duplicate/fatigue veroorzaakt;
- persoonsgegevens of kanaalgebruik niet rechtmatig/veilig zijn;
- een claim niet uit evidence volgt.

## Content
Content is pre-sales. Schrijf vanuit concreet CEO/directie/MT-probleem, data, impact, handelingsperspectief en aantoonbare toepassing van scan/portal.

## Learning
Meet minimaal trigger->response, response->meeting, meeting->scan, scan->sale, realized value en referral. Promote geen heuristiek tot harde policy zonder voldoende evidence.

## Runtime projection
De canonical opportunity authority projecteert commerciële context via `scripts/opportunity/opportunity-scout.mjs`. Voor `commercial_acquisition=true` zijn `trigger_type`, `problem_hypothesis`, `decision_maker_role`, `recommended_next_action`, voldoende `confidence` en minimaal één `evidence_ref` vereist voordat `commercial_execution_class=trigger-led-next-action` mag ontstaan. Ontbrekende velden blijven null en de uitvoering blijft `observe` met een `do_not_contact_reason`; geen inferentie of bulk-outreach als fallback.


## Supabase runtime authority
De production authority is `public.powerhouse_mkb_trigger_intelligence_v1` + `public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(date)`. Alleen expliciete company-trigger evidence/headlines/samenvattingen of company-scoped predictive signals mogen worden geclassificeerd; een gewone connection/relationship activation is geen kooptrigger. De materialisatie hergebruikt `powerhouse_opportunities`, `powerhouse_forecasts` en `powerhouse_sales_actions`. Automatisch wordt uitsluitend `research_enrichment` via kanaal `internal` aangemaakt; direct outbound blijft onder de bestaande execution gates. De bestaande cron `powerhouse-commercial-learning-v1` wordt hergebruikt via `powerhouse_trigger_based_mkb_acquisition_cycle_v1`; nooit een tweede scheduler maken.


## Production proof — 24 september 2026
Status: `LIVE_PROVEN_FAIL_CLOSED_RUNTIME`.

GitHub main bevat merge `4e16c5c496241ce516cd13373103c51b4f9fd6dd`. Supabase migration `trigger_based_mkb_acquisition_runtime_v1` is toegepast op project `adhjwmvyoixzjtmiroln`; view en beide runtimefuncties zijn teruggelezen. De bestaande cron `powerhouse-commercial-learning-v1` is actief op `27 * * * *` en voert `select public.powerhouse_trigger_based_mkb_acquisition_cycle_v1();` uit.

De eerste gecontroleerde refresh gaf 0 eligible triggers, 0 opportunities, 0 interne research-actions, 0 forecasts en `external_outreach_executed=false`. Dit is een geldige fail-closed uitkomst: zonder expliciet company-level triggerbewijs wordt niets verzonnen. Negatieve readback: 0 gewone `connection_activated` events zijn als kooptrigger geclassificeerd. Supabase advisors rapporteren geen lint op de nieuwe trigger-view/functions; bestaande bredere projectwaarschuwingen blijven afzonderlijk bestaan.


## Canonical Problem Library integration — 24 september 2026

Fingerprint: `powerhouse-50-problem-library-v1`.

Vanaf nu moet iedere commerciële trigger, problem hypothesis, Frisse Blik-route, contenthoek en capability-fit waar mogelijk verwijzen naar één canonieke `PH-Pxxx` uit `config/powerhouse-problem-library.json`. Maak geen tweede commerciële probleem-taxonomie.

Verplicht:
- externe trigger/signalering blijft `signal` of `hypothesis` totdat intern bewijs het probleem valideert;
- koppel economische impact aan `OBSERVED`, `ESTIMATED` of `POTENTIAL`;
- laat dezelfde Problem ID doorlopen van trigger → content/scan → Frisse Blik → capability → outcome;
- nieuw commercieel probleem zonder bestaande Problem ID wordt eerst als candidate voor de canonieke library behandeld, niet lokaal in sales/content uitgevonden;
- learning uit respons, scan, sale en realized value schrijft terug op dezelfde Problem ID.


## Problem Radar intake authority — 25 september 2026

Fingerprint: `powerhouse-problem-radar-canonical-intake-v1`.

Commerciële triggers en contentkansen die ontstaan uit nieuwe MKB-bronnen mogen niet rechtstreeks een losse sales/content-waarheid vormen. Lees en hergebruik de canonieke evidence lineage uit `config/powerhouse-problem-radar-intake-contract.json`: dedupe -> bestaande `PH-Pxxx` -> problem hypothesis -> relevante capability -> next-best-action/content -> outcome learning. Externe signalen blijven hypothese/context totdat tenant- of company-evidence het probleem ondersteunt. Dezelfde bron/probleemlineage wordt hergebruikt voor portal, Frisse Blik, content en commerciële learning.


## Relationship-to-revenue self-first — 28 september 2026

Fingerprint: `powerhouse-relationship-revenue-engine-v1`.

De canonical commerciële cyclus activeert nu ook de bestaande relatiegraph vóór trigger-materialisatie. De bronvolgorde is verplicht: Powerhouse first-party evidence -> bounded publieke web-evidence -> alleen optionele vendor-enrichment voor een aantoonbaar resterend datagat. Apollo en vergelijkbare vendors zijn nooit required dependency, canonical truth of eigenaar van score/next-best-action.

Runtime authority:
- `public.powerhouse_relationship_revenue_intelligence_v1`
- `public.powerhouse_refresh_relationship_revenue_v1(date)`
- dezelfde bestaande `powerhouse-commercial-learning-v1` scheduler via `powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)`

Een gewone connectie of warme relatie blijft géén kooptrigger. Kansrijke relaties krijgen eerst interne `research_enrichment`; een activation review ontstaat alleen bij bestaande opportunity-/waarde-evidence. Ongevraagde externe outreach blijft human-authorized. Geen scraping, platform-bypass, parallel CRM, tweede scheduler of vendor lock-in.


## First verified paid customer — P0, 1 november 2026

Deze prioriteit is een **extra beslisregel binnen de bestaande Growth & Revenue OS / ONE BRAIN / Heartbeat**, géén tweede CRM, afzender, scheduler of researchagent. Tot de eerste onafhankelijk bewezen betaalde order is gerealiseerd, rangschik de bestaande `powerhouse_opportunities` en `powerhouse_sales_actions` op **echt onderbouwde conversiekans**, beslissersfit en geldige contactautoriteit. Grote aantallen interne researchtaken of voorspelde opbrengst zijn geen salesoutput.

### Productiebaseline en bewijsgrenzen
- Productiecontrole 2026-11-01: 938 opportunityrecords (718 open opportunity, 219 open signal, 1 deferred signal); 10.772 verkoopacties waarvan 8.631 expired, maar 7.425 daarvan `research_enrichment` intern. Nooit 80% verlopen als 80% mislukte uitgaande berichten rapporteren.
- Externe kanalen (zonder internal/internal_research): 1.206 verlopen, 821 skipped, 38 done en 161 suggested/prepared/waiting. `done` is geen providerbewezen contact.
- Drie bestaande `autonomous_email` acties hebben `prepared` plus `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`; zij zijn *niet verzonden*. De oorspronkelijke relatie-onderzoekstaken staan bij twee acties `done`, bij één `waiting`; een onderzoekstaak `done` bewijst geen geschikte bron of een verkoopuitkomst. De originele composer en provider-acceptatie moeten opnieuw onafhankelijk slagen; nooit autorisatie of broncontext verzinnen.
- E-mailstatistiek op dezelfde datum: 27 sent, 2 replies, 0 positive replies, 0 meetings, 0 proposals, 0 orders, €0 realized; checkout: 5 intents (2 expired, 2 created, 1 completed), maar slechts één `trial` subscription met `canceled` status. Een checkout-intent `completed` is geen actieve betaalde subscription of bank/provider-bewezen betaling.
- Markeer de sales-keten ROOD/UNVERIFIED zolang `qualified meeting -> accepted proposal -> payment provider proof` ontbreekt. `scan_completed` of `page_view` is geen identificeerbare/benaderbare lead; `is_robot=true` uitsluiten uit menselijk verkeer. GA4-stale niet door lokale events vervangen alsof dit dezelfde bron is.

### Werkvolgorde van de bestaande agents
1. **Eén instapaanbod testen, geen product-sprawl:** prioriteit op een concrete operationele pijn bij Nederlandse MKB-directie/MT; bied waar passend de **Directie & AI Workshop €1.950** aan. Gratis Frisse Blik (30 minuten) is een diagnosegesprek, geen betaalde scan. Alternatief alleen bij passende scope: Bedrijfsgeheugen Scan €2.950. De prijzenpagina `https://www.bedrijfsgeheugen.nl/prijzen` is de bron voor actuele prijzen; oude blogs met 'Frisse Blik €2.900' of 'scan €2.900' vormen **CRO copy drift**, niet het actuele aanbod. Maak voor correctie een bestaande CMS/website-content kandidaat onder de eigenaar; geen stille live prijswijziging.
2. Neem uit de **bestaande** warme/trigger-geschikte relaties maximaal 30 reviewkandidaten voor een 14-daagse validatie, maar verstuur uitsluitend wat door consent, suppression, cooldown, identiteit, recente bedrijfsbron, nuttige boodschap, daglimieten, dedupe en provider-capability komt. '30 benaderen' is een doel voor *geschikt geselecteerde* contacten, geen volumequota of override van veiligheid.
3. Vraag om één kleine concrete vervolgstap per bericht; vermijd generieke AI-pitches, ongevraagde productdemo's en claims over eigen klantresultaten die niet bestaan. Maak geen onwaarachtige urgentie. Leg antwoord, bezwaren en geen-reactie in dezelfde originele action/outcome lineage vast.
4. Sluit een kans niet bij `research done`, `message prepared`, `email sent` of `scan completed`. Gebruik verificatie per fase: provider-ID en readback voor verzonden bericht; reply-ID voor reactie; kalenderbevestiging/ontvangerreactie voor afspraak; eigen echt verstuurde offerte voor voorstel; daadwerkelijke payment/provider-verificatie voor order en gerealiseerde omzet.
5. Meet wekelijks op **verschillende noemers**: eligible contacts -> provider-proven sends -> verified replies -> qualified meetings -> proposals -> independently paid orders. Geef per fase aantallen, cohort/tijdvenster, ontbrekend bewijs, uitvaloorzaak, voorgestelde hypothese en volgende veilige actie. Zorg dat de portal gebruikers `UNKNOWN` toont waar data ontbreekt, nooit nul of groen als placeholder.
6. Oorzaak & leren: echte prospect-afwijzing, ontbrekende bron, verdachte bronmatch, pricing drift, no reply, checkout drop-off en betaalbewijs ontbreken krijgen fingerprint/owner/herstelbewijs/regressietest/preventie in dezelfde Brain/Heartbeat/incidentlijn. Alleen observed outcome bepaalt of een experiment 'wint'.

Deze activiteit maakt **geen belofte** dat binnen 14 dagen een order binnenkomt. Het is een falsifieerbare validatie: bij 0 afspraken met aantoonbaar geldige benaderingen moet de propositie, doelgroep, bewijs- of contactmethode veranderen in plaats van opnieuw agentcapaciteit toe te voegen.

## SOURCE VERIFIED-TENANT CLAIM → FIRST REAL CONVERSION (2026-11-02)
**Original source incident:** `powerhouse|commercial|verified-claim-conversion-gap-signed-quote-not-paid|20261102-v1`, parent P0 #4198. Geverifieerde tenant is geen bijzaak: de originele `scan_inzendingen` ontstaat meestal `unverified` (2 november: 56/58; overige 2 demo). De oorspronkelijke AFTER INSERT trigger maakte deze records terecht nog niet commercieel, maar miste een latere legitieme overgang naar `tenant_identity_status=verified`. Herstel met originele AFTER INSERT **of** UPDATE van `tenant_identity_status,organisatie_id`, en voer uitkomst maar éénmaal op oorspronkelijke bron-ID via `intern.bg_uitkomst_eenmalig`. Zonder tenantbevoegdheid, expliciet herkende klant en echte bronstatus mag er geen lead worden geteld. Voeg geen willekeurige PII toe aan Brain of growth analytics.

**Offerte is geen betaling:** de vier `getekend=true` offertes van samen €51.200 waren op broncontrole **demo**, niet echte betalende klanten. Zelfs bij een echte, geverifieerde offerte geldt: `proposal` kan worden gemeten, `getekend` blijft alleen contract-/offertestatus en `totaal` is uitsluitend een nominale offertewaarde. `won_order` en gerealiseerde `revenue_eur` worden niet uit getekend-formulier afgeleid; alleen afzonderlijke, exact gekoppelde betaalprovider-/factuurreconciliatie kan de bestaande betaalde-ordermeting autoriseren. Ontbreekt betaling, houd bedrag 0 en resultaat EVIDENCE_DUE.

Voor iedere agent, skill en portal-readmodel: scheid `scan_submitted`, `identity_claimed`, `qualified_lead`, `proposal`, `signed_not_paid`, `paid_order` en `realized_customer_value`, met bronbewijs per overgang. Geen nieuwe scheduler, tweede writer, parallelle CRM of permissieomzeiling. Oude demo- en unverified-records niet achteraf promoveren; een latere claim vereist huidige geautoriseerde brontransitie. Regressie `tests/brain-verified-tenant-intake-quoted-value-payment-truth-20261102.test.mjs`; menselijke runbook `docs/changes/2026-11-02-verified-intake-outcome-payment-truth.md`; oorspronkelijke SQL-bron `supabase/migrations/20261102074013_verified_tenant_intake_and_quoted_value_payment_truth.sql`. Sluit incident pas na beschermde source+Supabase migratie+provider-readback, volgende natuurlijke run en onafhankelijke betaal-/klantwaardecontrole.
