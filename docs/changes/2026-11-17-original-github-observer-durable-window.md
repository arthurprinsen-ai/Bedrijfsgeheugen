# 17 november 2026 — Bestaande GitHub-incidentobserver bewaart bewijs per volledig bronvenster

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Wat is daadwerkelijk waargenomen?
- GitHub originele Required-run 44053428979 was volgens native Actions exact completed/failure op 17 november 09:13 UTC.
- Originele ONE BRAIN had voor deze exacte GitHub run/attempt geen occurrence; laatste van 2.554 native observer-occurrences was 17 november 04:32 UTC.
- Met de **bestaande** public.brain_observe_failure is deze ene echte occurrence alsnog idempotent toegevoegd en exact (occurrence-ID, fingerprint, payload-SHA256 en native run-SHA) onafhankelijk teruggelezen om 09:40 UTC. Dit is herstel van één geobserveerd incident, niet bewijs van uitputtende dekking.
- Apart bronincident: github|janitor|native-actions-observer-freshness-gap|20261117-v1 (maturity OBSERVED, OPEN; dezelfde P0).

## Codebewezen risico, niet gefingeerde diagnose

De oorspronkelijke tools/delivery/github-actions-failure-observer.mjs scant 12 vieruursvensters, valideert alle pagina's en voert pas aan het **einde** alle Brain-writes uit. Onvolledige GitHub-pagination, veranderende source count, timeouts of een venster > 1.000 runs kan die functie eerder laten falen, zelfs wanneer andere vensters al volledig zijn gecontroleerd. Het is niet onafhankelijk vastgesteld welke mogelijke fout het feitelijk uitblijven van observer-writes na 04:32 veroorzaakt; dat vereist de oorspronkelijke native Janitor-joblog.

## Beperkte codefix in dezelfde originele owner

De bestaande uurlijkse Repository Janitor en dezelfde tools/delivery/github-actions-failure-observer.mjs blijven exclusief. De bestaande scan begint bij de oudste stabiele vieruursvensters en schrijft na elk **volledig en consistent** bronvenster de nieuw geobserveerde immutable GitHub Actions-failures via dezelfde public.brain_observe_failure met original occurrence-ID en provider-hash terug. Onafhankelijke read-after-write per batch; repeat = ALREADY_VERIFIED. Vóór een volgende source-API call zijn de eerder geslaagde vensters duurzaam vastgelegd.

Een later onvolledig of inconsistente window blijft een **fout**: READBACK_COMPLETE=false, GLOBAL_GREEN=false, bronafhankelijke next-run recovery. De bestaande Janitor-artifact bewaart uitsluitend partial_checkpoint met aantallen (completed_windows, scanned, pages, verified_failures, recorded, already_verified), nooit credentials, ruwe fouten of vertrouwelijke providerheaders. Er is geen nieuwe cronjob, incidentregister, tweede agent, webhook, queue, publieksrapportage, provider-send of budgetverruiming.

## Gerichte regressie

tests/brain-github-actions-observer-durable-window-20261117.test.mjs controleert: gecontroleerde oudere buckets blijven geregistreerd als de laatste bucket faalt; incomplete eerste bucket schrijft niets; verschillende echte run-ID's krijgen elk één occurrence; identieke retry dupliceert niets; tegenstrijdige hashes blokkeren; original hourly workflow blijft één eigenaar. De bestaande 2026-11-04 scanner-/batchregressies blijven van kracht.

## Productiebewijs vereist

Dit bestand en een geslaagde test zijn slechts een **kandidaat**. Voor PROVEN: exact beschermd Required+CodeQL, merge, originele natuurlijke uurlijkse Janitor-run met werkelijk nieuw getroffen GitHub-run-event en originele ONE BRAIN-occurrence/readback, de bewijsgrens bij gedeeltelijke bronfout, daarna een volgende natuurlijke run voor herhaalbaarheid. Uitgestelde oude/afwezige fouten blijven OPEN en worden niet als nul of gesloten beschouwd; oude >48h source gaps vereisen een aparte brongetrouwe herstelactie door dezelfde eigenaar. PR/proof en oorzaak in bestaande issue #4198.
