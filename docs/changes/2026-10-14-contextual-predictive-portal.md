# Contextuele prognoses in het klantportaal

Op **Vandaag** toont POWERHOUSE alleen een prognosegrafiek als historisch gemeten waarden en afzonderlijke modelprognoses in de beveiligde portaalcontext aanwezig zijn. De grafiek bevat filters voor onderwerp en tijdshorizon en een wat-als-regelaar. De wat-als-regelaar past waarden rekenkundig aan; dit is geen gevalideerde causale modelberekening.

Op andere pagina's ziet de ondernemer contextueel passende onderwerpen. De grafiek vermeldt bron, model en peildatum. Ontbrekende gegevens leveren een duidelijke lege toestand op, geen fictief bedrijfsresultaat. Een ontbrekende of niet-gevalideerde providerkoppeling blijft zichtbaar als open acceptatiepunt.

**Release:** PR #4369 moet via alle beschermde CI-controles, gecontroleerde merge en productie-readback. Klantisolatie, historische voorspellingsnauwkeurigheid en daadwerkelijk gevalideerde interventie-effecten moeten apart worden bewezen.

## Productiebroncontract — gecontroleerd op 14 oktober 2026

Supabase project `adhjwmvyoixzjtmiroln` bevat `powerhouse_forecasts`, `powerhouse_forecast_calibration` en `powerhouse_forecast_quality_v2`. Het bestaande `powerhouse_forecasts`-schema bevat onder andere `forecast_id`, `scope`, `scope_key`, `probability`, `confidence`, `predicted_event`, `revenue_potential` en `evidence`. Er zijn **geen** afzonderlijke `history`/`forecast`-tijdreeksvelden vastgesteld; dit is primair een voorspelling van gebeurtenissen/commerciële signalen, geen directe financiële tijdreeksbron.

**Blokkeer foutieve mapping.** Een probabiliteit of revenue_potential mag niet als gerealiseerde omzet, liquiditeit of voorspelde omzetreeks worden getoond. De interactieve grafiek vereist een authentieke tenant-gebonden serie met per periode historische observaties, modelprognoses, modelversie, bronevidence, peildatum, tijdseenheid, validatiestatus en zo nodig betrouwbaarheidsbanden. De API moet gebruikersidentiteit en tenantautoriteit server-side afdwingen en nooit resultaten uit de publieke database aan willekeurige browsers leveren.

**Open acceptatie:** (1) leverancierclaims voor de catalogus volledig bewijzen; (2) verplichte CI; (3) beveiligde merge; (4) server-side tenantgebonden forecast-endpoint en geautoriseerde klantreadback inclusief prognosekwaliteit. De aanwezigheid van bestaande databaseobjecten is geen goedkeuring van deze vier controles.


## Herstel financiële tijdreeksbron — 14 oktober 2026

- Live Supabase-migratie `20261014191753_portal_tenant_financial_forecast_evidence_source_v1` heeft `public.portal_financial_forecasts_v1` aangemaakt met een samengestelde sleutel op `(tenant_id, forecast_id)`.
- RLS staat aan en de database verleent `anon` en `authenticated` geen rechtstreekse tabeltoegang. De service role is alleen voor de server-side Supabase Edge gateway bedoeld. Gecontroleerde uitkomst: 0 opgeslagen, 0 gevalideerde financiële prognoses.
- De server-side Netlify-route `/api/portal-forecasts` vraagt via de bestaande `portal-state-eu` gateway de action `financial_forecasts` op. Tenant komt alleen uit de server-gevalideerde Netlify-identiteit, niet uit query/body. Zowel gateway als store als response-filter houden tenant-isolatie en de bron-/backtestchecks in stand.
- Voor `passed` vereist de database een geverifieerde bronverwijzing, modelversie, meetreeks, een afzonderlijke toekomstige reeks, onafhankelijke beoordelaar, verificatietijd en geslaagde backtest. Import mag alleen plaatsvinden uit een echt geautoriseerd financieel bronsysteem met herleidbare documentatie; `powerhouse_forecasts` is **geen** financiële bron. De databasevoorwaarden bewijzen niet uit zichzelf dat de onderliggende externe bron onafhankelijk is gecontroleerd.
- **Niet live:** de nieuwe Edge-route en Netlify-route zijn uitsluitend in deze PR gewijzigd. De gebruikte Edge productieversie is nog niet via beschermd releaseproces bijgewerkt. Er zijn nog geen echte gevalideerde tijdreeksen ingelezen en geen tenant-backtest/eindgebruikerstest gedaan.
- **CI-blokkade:** preflight faalde op `tests/ai-model-intelligence-freshness-v1.test.mjs` (`gpt-6-astra verification is stale`). Leveranciersbewijs niet artificieel goedkeuren of uit het verplichte testpad halen. CodeQL voor de voorgaande PR-head was groen; nieuw hoofd vereist eigen CI.
- **Vervolg voor acceptatie:** bevoegde klantbron autoriseren, authentieke historie importeren, historische voorspellingen backtesten, onafhankelijk valideren en readback uitvoeren; vervolgens exacte-head Required + CodeQL, beschermde merge, Edge-deploy, Netlify-productie en geauthenticeerde cross-tenant/live readback. Geen productieclaim zolang een van deze eisen ontbreekt.


## Afzonderlijke integriteitsversterking

- Live migratie `20261014193133_portal_financial_forecast_backtest_integrity_v2` vereist bij `passed`: minimaal drie holdout-waarnemingen, gemeten MAE en baseline-MAE. Bandreeksen zijn allebei aanwezig of allebei afwezig en moeten dezelfde lengte hebben als de prognosepunten. Databaseconstraints zijn teruggelezen.
- De Netlify-API leest nu ook **directe** `{forecasts:[...]}`-antwoorden van de tenantgebonden EU-gateway; voorheen werden alleen `payload.data`, `payload` of `data` gelezen, waardoor valide directe antwoorden leeg bleven.
- De serverfilter accepteert alleen canonieke geordende dag- of maandperioden, minimaal drie historische observaties, een toekomstig prognosebereik en passende onzekerheidsbanden. Ongeldige kalenderdagen, dubbele periodes, ontbrekende punten en perioden die elkaar overlappen vallen af.
- De Edge-gateway vereist nu ook een geregistreerde bronbewijsreferentie en expliciete backtestmetingen, zonder het interne bronbewijs aan de browser te verstrekken.
- Nieuwe en gewijzigde tests staan in `tests/portal-forecast-auth.test.mjs` en `tests/portal-financial-forecast-store.test.mjs`; een volledige succesvolle beschermde CI-run op de laatste commit is nog niet aangetoond.
- Source state blijft **0 klantreeksen, 0 geverifieerde prognoses**; vendor-gate en productie-readback blijven onafhankelijk vereist. Vertrouw de `VERIFIED`-status niet zonder claimniveau-evidence.


## Beschermde release-integratie en Supabase Preview-herstel — 15 oktober 2026

De leverancierscatalogus is inmiddels via beschermde PR #4374 gemerged, met geslaagde Required en CodeQL, en een geslaagde Netlify-productie-readback op de catalogusrelease. De financiële portalimplementatie is met die hoofdversie geïntegreerd als een *nieuw* herstelvoorstel, zonder de leverancierstests te verwijderen. De oorspronkelijke PR #4369 had een langlopende GitHub-branch die niet aan een Supabase Preview Branch was gekoppeld: de verplichte providercheck gaf `skipped` en de release werd terecht geweigerd. PR #4388 gebruikt daarom een nieuwe releasebranch en moet zelf een provider-owned Supabase Preview op het exacte nieuwe commit-SHA bewijzen. Een overgenomen oude check of alleen geslaagde broncontracttests tellen nadrukkelijk niet als previewbewijs.

De API accepteert maximaal 30 gevalideerde weergavereeksen na controles, waarbij de gateway een begrensde kandidatenpool uitleest. De financiële validator controleert minstens zes historische perioden, bronouderdom, onafhankelijke beoordelaars, holdout-replay en het verbod op toekomstige realisaties. De productietabel bevat bij de laatste controle nog geen goedgekeurde echte klantprognoses; de interface moet daarom expliciet geen geverifieerde financiële prognose tonen. Pas na groen providerbewijs, Required/CodeQL, beschermde merge en live tenant-isolatie-/deploy-readback kan deze aanvullende financiële release worden afgemeld.
