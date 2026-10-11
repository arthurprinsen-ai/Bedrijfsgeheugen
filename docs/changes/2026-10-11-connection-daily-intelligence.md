# Dagelijkse connectie-intelligentie — 11 oktober 2026

## Functionele afspraak
Ieder bestaand contact krijgt elke kalenderdag (Europe/Amsterdam) een gedateerde contextbeoordeling. Relevante, al rechtmatig ingelezen zakelijke bronnen en toegestane LinkedIn-signalen worden meegenomen. Een wijziging kan leiden tot onderzoek, signalering voor het bestaande Next Best Action-model, opvolgadvies of bewust geen actie. Er wordt hierdoor niet automatisch een bericht verstuurd.

## Techniek
Geen tweede contactdatabase, scheduler, Heartbeat, Brain of kanaaluitvoerder. De bestaande `bg_connecties`, `powerhouse_connection_enrichment_state_v1`, `powerhouse_refresh_connection_enrichment_batch_v1` en cron job 138 blijven leidend. Identiteitsgrafiek draait op de bestaande minuut :32. Twee begrensde batches van 500 elke vijftien minuten kunnen ~23.295 contacten in circa zes uur behandelen, afhankelijk van runtimebelasting. Twee nieuwe expressie-indexen helpen kostbare bedrijfsvergelijkingen.

## Brontransparantie
Een dagelijkse review is **niet** hetzelfde als 23.295 nieuwe externe lookups, actuele LinkedIn-authenticatie, een commerciële verzending of een bewezen order. De snapshot markeert expliciet dat geen fresh provider lookup of send binnen de review is uitgevoerd. Die stappen vallen onder hun eigen bestaande bron- en kanaalbeleid, consent, dedupe, contact pressure en provider receipts.

## Productievalidatie
Bij onderzoek: 23.295 contactrecords, dagelijks verrijkt 0; bestaande SQL-actie #116 had time-outs. Bounded handmatige verwerking verhoogde de meting tot minstens 3.050. De nieuwe migratie is pas productiebewezen als beschermd gemerged, uitgerold, herlezen en 23.295/23.295 bevestigd. P0 #4198 blijft anders open.
