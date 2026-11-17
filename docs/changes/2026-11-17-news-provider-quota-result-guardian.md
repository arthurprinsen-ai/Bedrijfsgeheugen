# P0 #4198 — nieuwsbronquota onder de bestaande Result Guardian

Datum: 17 november 2026. Zelfde oorspronkelijke `#171` guardian, bedrijfsnieuws-`#20`, commerciële onderzoeks-`#116`; geen nieuwe agent, cron of parallel verzendroute.

## Gecontroleerde feiten (geen veronderstellingen)
- Cron `#20 bg-bedrijfsnieuws-werkdagen` staat actief; zijn twaalf recente runs hebben in `cron.job_run_details` allemaal SQL-status `succeeded`, laatste 17 november 06:31 UTC.
- De werkelijke `net._http_response` voor **dezelfde** provider-call 17 november 06:31 UTC is **HTTP 500** met inhoud `{"ok":false,"error":"TAVILY_432"}`. Tavily's officiële foutdocumentatie duidt HTTP 432 aan als **planlimit overschreden**: https://help.tavily.com/articles/8645538886-understanding-http-errors. De SQL-cron was groen terwijl HTTP-producer rood was.
- De laatste `bg_bedrijfsnieuws.opgehaald_op` is 8 november; het laatste expliciete provider-`bg_gezondheid` succes voor `bg-bedrijfsnieuws` dateert van 3 november. Cron-gezondheidsprojectie voor `bg-bedrijfsnieuws-werkdagen` bleef 17 november `ok`.
- Er zijn 123 bestaande intern goedgekeurde contacten met e-mailadres maar slechts **twee** daarvan met actuele geaccepteerde bedrijfsnieuwsbron; bij vier bestaande trigger-ready approved kandidaten heeft geen één zo'n nieuwsbron. Dit is brongebrek, geen Gmail-authenticatiefout en geen recht om verzendkwaliteit te verlagen.
- Originele onderzoekstaken voor twee actuele voorbereide e-mails eindigen terecht in `NO_VERIFIED_SOURCE_IN_BOUNDED_ORIGINAL_SEARCH`; de deadlines op 18 november blijven van kracht. De bestaande composer faalt gesloten op `SOURCE_SPECIFIC_EVIDENCE_REQUIRED`.

## Correctie in de oorspronkelijke bestaande bewaker
De originele `public.powerhouse_original_result_guardian_v1()`, reeds gekoppeld aan de natuurlijke #171 `bg_gezondheid`-INSERT, controleert nu:
1. nieuws-ingeststempel, onafhankelijk providergezondheidsbewijs en de actuele oorspronkelijke cron #20;
2. `net._http_response` HTTP 500 plus exacte `TAVILY_432` binnen 36 uur — planlimiet is een terminale providerquota-bewijsstatus, geen tijdelijke 429;
3. `PROVIDER_NEWS_INGEST_STALE` wanneer de cron wel draait maar provider- en nieuwsbronstempels minimaal 72 uur achterlopen; het is een **onzekerheid/stale status**, niet automatisch hetzelfde als HTTP 432;
4. behoud dezelfde `original-result-guardian:<UTCuur>:commercial` dedupe, bestaande runtime event/health evidence, incident #4198, original owner `bg-bedrijfsnieuws #20`. Laat diezelfde bestaande gezondheid rood worden bij daadwerkelijk bronverlies, ook als de SQL-cron als geslaagd terugkeert.
5. Bij exacte Tavily-planlimiet **geen extra, ongefundeerde nieuwe e-mailkandidaat** genereren. Voor geautoriseerde bronnen die al in het systeem zitten mogen de bestaande onderzoeker/composer/NBA veilig doorwerken. Geen nieuwe Tavily-call, accountupgrade, nieuwe API, nieuwe sender, dubbele scheduler of zwakkere persoons-/bron-/consent-gates.

## Grenzen en acceptatie
Een 432 kan niet technisch worden opgeheven zonder beschikbaar quotum of door de eigenaar geautoriseerde andere broncapaciteit. De guardian mag geen ongeautoriseerde bestedingen doen en geen mail verzinnen. De enige volledige herstelclaim vereist onafhankelijke nieuwe geslaagde originele nieuwsbronverwerking **of** aantoonbaar reeds geautoriseerde betrouwbare bron voor de exact gekozen relatie, daarna oorspronkelijke composer-pass en eventueel Gmail-provider-ID/readback. Bij ontbreken daarvan blijft `DEGRADED` met juiste oorzaak/eigenaar.

Regressie `tests/brain-guardian-news-provider-truth-20261117.test.mjs`. Protected Required/CodeQL/Supabase Preview, originele SQL-functiepariteit en natuurlijke #171 productietick vereist. Rollback alleen via beschermde PR; behoud alle oorspronkelijke cronjobs actief.
