# Contextuele prognoses in het klantportaal

Op **Vandaag** toont POWERHOUSE alleen een prognosegrafiek als historisch gemeten waarden en afzonderlijke modelprognoses in de beveiligde portaalcontext aanwezig zijn. De grafiek bevat filters voor onderwerp en tijdshorizon en een wat-als-regelaar. De wat-als-regelaar past waarden rekenkundig aan; dit is geen gevalideerde causale modelberekening.

Op andere pagina's ziet de ondernemer contextueel passende onderwerpen. De grafiek vermeldt bron, model en peildatum. Ontbrekende gegevens leveren een duidelijke lege toestand op, geen fictief bedrijfsresultaat. Een ontbrekende of niet-gevalideerde providerkoppeling blijft zichtbaar als open acceptatiepunt.

**Release:** PR #4369 moet via alle beschermde CI-controles, gecontroleerde merge en productie-readback. Klantisolatie, historische voorspellingsnauwkeurigheid en daadwerkelijk gevalideerde interventie-effecten moeten apart worden bewezen.

## Productiebroncontract — gecontroleerd op 14 oktober 2026

Supabase project `adhjwmvyoixzjtmiroln` bevat `powerhouse_forecasts`, `powerhouse_forecast_calibration` en `powerhouse_forecast_quality_v2`. Het bestaande `powerhouse_forecasts`-schema bevat onder andere `forecast_id`, `scope`, `scope_key`, `probability`, `confidence`, `predicted_event`, `revenue_potential` en `evidence`. Er zijn **geen** afzonderlijke `history`/`forecast`-tijdreeksvelden vastgesteld; dit is primair een voorspelling van gebeurtenissen/commerciële signalen, geen directe financiële tijdreeksbron.

**Blokkeer foutieve mapping.** Een probabiliteit of revenue_potential mag niet als gerealiseerde omzet, liquiditeit of voorspelde omzetreeks worden getoond. De interactieve grafiek vereist een authentieke tenant-gebonden serie met per periode historische observaties, modelprognoses, modelversie, bronevidence, peildatum, tijdseenheid, validatiestatus en zo nodig betrouwbaarheidsbanden. De API moet gebruikersidentiteit en tenantautoriteit server-side afdwingen en nooit resultaten uit de publieke database aan willekeurige browsers leveren.

**Open acceptatie:** (1) leverancierclaims voor de catalogus volledig bewijzen; (2) verplichte CI; (3) beveiligde merge; (4) server-side tenantgebonden forecast-endpoint en geautoriseerde klantreadback inclusief prognosekwaliteit. De aanwezigheid van bestaande databaseobjecten is geen goedkeuring van deze vier controles.
