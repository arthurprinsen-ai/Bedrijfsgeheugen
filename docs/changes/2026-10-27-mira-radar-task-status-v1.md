# Mira-radar: mislukte providertaak is een fout, geen "0 resultaten"

Datum: 27 oktober 2026. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bestaande oorzaak
De radar controleerde bij DataForSEO alleen de HTTP-status en de status van het hele verzoek. Een mislukte taak (40101) gaf lege items terug, waardoor de eerste echte run `ok:true` met 0 resultaten meldde terwijl er niets was gezocht.

## In-place herstel
De taakstatus wordt gecontroleerd, met één herhaling; een blijvende fout komt in `errors` van de runrespons. De respons toont ook `tavily_raw`, zodat zichtbaar is of Tavily niets leverde of dat de datumfilter alles afkeurde.

## Nog niet claimen
Geen winnaar tot een run echt verse, gedateerde signalen opslaat.
