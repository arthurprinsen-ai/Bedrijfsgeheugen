# Brongebonden autonome financiële driverforecast — 15 november 2026

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Probleem
De oorspronkelijke directiecockpit kan scenario-forecast en gerealiseerd netto resultaat afzonderlijk weergeven. Zonder aangeleverde financiële scenario-records wordt er echter geen cijfer geproduceerd, zelfs wanneer originele tenantacties reeds gecontroleerde proces-/kostendrijvers bevatten. Er mag nooit extra geschatte omzet of besparing ontstaan zonder bron.

## Scoped oorspronkelijke oplossing
De huidige `customer-value-briefing` gebruikt bij afwezige `action.financial_forecast` optioneel `action.financial_model_inputs` binnen dezelfde geauthenticeerde executive tenant source. De zuivere `deriveSourceBoundFinancialForecast` modelleert tijdgedreven activiteitkosten (TDABC), Lean herstelverlies en optioneel gedemonstreerde extra throughput/contributiemarge. Het model vereist per driver een numerieke bronref, handhaving van tenant-ID, originele actie-ID, baseline, periode, datum en inputbronrevisie; geen bron, geen model. De vier source-bound hypotheses `no_action`, `downside`, `base`, `upside` hebben expliciete varianten met adoptiefractie. Voor elk rekent de code reproduceerbaar bruto potentiële verbetering minus implementatie en exploitatie; capaciteitsuren en financieel verzilverbaar aandeel zijn gescheiden. Bij gebrek aan cash-capture-bewijs blijft eurooutput onbekend.

`NET_SAVINGS_EUR` mag geen extra verkoopunits bevatten; `NET_ECONOMIC_VALUE_EUR` is een afzonderlijke prognose als de interventie ook een contributiemarge genereert. Deze waarde is geen gerealiseerde order of kasstroom. No-action = EUR 0 *incremental versus niet ingrijpen*, niet een claim dat de onderneming geen kosten heeft.

## Bewijsgrens en acties
De projector voegt uitsluitend een `MODELLED_NOT_REALIZED` dossier toe. Hij schrijft geen portaaldata of database-rijen, voert geen providerside-effect uit en sluit geen actie. Het oorspronkelijke authorisatie-/ONE BRAIN- en Heartbeat-pad moet na een werkelijke, door een provider teruggelezen actie een onafhankelijke vóór-/nameting, werkelijke bruto-besparing, investerings-/exploitatiekosten, causale controle en de volgende learningbeslissing opslaan, alvorens een bestaande actie echt terminal mag worden. De bestaande activa en scheduler blijven onaangeroerd. De actuele productie bevat geen gevulde tenantforecasts, geen realized-value records en geen bewezen financiële uitkomsten.

## Toets en uitrol
`tests/brain-source-bound-financial-scenario-decision-loop-20261115.test.mjs` controleert exacte 0/-340/5600/12680 casusbedragen, capaciteit versus cash, ontbrekende input, verkeerde tenant/baseline, verkeerde metriek, implementatiekosten, XSS-escaping en geen sluiting zonder werkelijk bewijs. Pre-existing customer-value en financial-decision regressies blijven actief. Beschermde Required/CodeQL en exacte Netlify-commit/readback verplicht voordat deze correctie live kan heten.
