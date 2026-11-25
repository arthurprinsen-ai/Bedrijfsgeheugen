# Mira-radar en materializer weer in lijn met het ondernemerscontract

Datum: 27 oktober 2026. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bestaande oorzaak
De radar zocht zes tijdloze consumentenonderwerpen zonder nieuwsvenster, waardoor nooit een bron binnen 14 dagen binnenkwam. De materializer accepteerde bovendien alleen consumentenklachten en verbood de zakelijke brug, terwijl de orchestrator (#4267) een ondernemersprobleem met portaalbrug eist. Zo kon geen signaal winnaar worden: voor 26 en 27 oktober bestond geen dagwinnaar.

## In-place herstel
Bestaande radar: 7 MKB-zoekopdrachten die op 12 onderwerpen en bestaande PH-P-records mappen, Tavily-nieuws (14 dagen) en DataForSEO Google News met filter op de publicatietijd; de gedeelde versheidspoort blijft ongewijzigd leidend. Bestaande materializer: ondernemerssignalen met `portal_problem_id` worden dagwinnaar met `approved_canonical_problem_id` en de bibliotheekscène, zodat de bestaande frozen-winner-resolver de bibliotheekroute neemt. Onveranderd: onveranderlijke dagwinnaar, 60 dagen versheid, 90 dagen bronontdubbeling, alleen `service_role`.

## Nog niet claimen
Geen winnaar, media of publicatie voordat de run van 20:02 UTC na deploy dagverse signalen opslaat en de bestaande keten daar bewijs van schrijft. #4265 wordt hierdoor vervangen. Geen klantresultaten of omzet.
