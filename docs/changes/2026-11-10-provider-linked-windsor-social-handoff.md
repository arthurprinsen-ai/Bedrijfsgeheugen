# Herstel originele LinkedIn-bedrijfsmeting → social-learning → BRAIN-overdracht

## Probleem
De oorspronkelijke uurlijkse social-learning-evaluator accepteerde alleen `OBSERVED` en `PROVIDER_OBSERVED`. De live Windsor-LinkedIn-bedrijfsmetingen bevatten sterker providerbewijs met status `PROVIDER_OBSERVED_LINKED`. Juist deze bronspecifieke observaties werden overgeslagen. Daardoor kon de oorspronkelijke post nooit via hetzelfde 24/48/72-uursvenster tot exacte evaluatie en oorspronkelijke BRAIN-ontvangstbevestiging komen, zelfs wanneer tijd en postidentiteit overeenkwamen.

## Herstel
Dezelfde originele evaluator, gegevensopslag en bronnen-ACK delen één aanvullende bronherkenning. Alleen daadwerkelijk gekoppelde LinkedIn-bedrijfspostmetingen met identieke externe post-URN, geverifieerd organisatieaccount, onafhankelijke auteurcontrole, brongebeurtenis en numerieke impressies zijn admissibel. De bestaande tijdsgrens van zes uur, gelijkheid van metingen en originele deterministische evaluation-ID blijven vereist. Een ontbrekende of gedeeltelijke meting blijft open. Er komt geen tweede scheduler, publisher, meetbron, provideraccount of database met alternatieve uitkomsten.

## Verifieerbare overdracht
De oorspronkelijke uurlijkse route blijft: LIVE_PROVEN post → onafhankelijk provider-event → 24/48/72h gemeten bron → originele evaluatie → bron-ACK → originele BRAIN-child-ACK → afzonderlijke leer-/experiment-/omzetcontrole. Bron-ACK betekent uitsluitend dat de meting eerlijk is verwerkt en niet dat een experiment werkt.

## Kwaliteitsbewaking
Tests eisen exact post- en organisatie-ID, brongebeurtenis, echte tijd, passende numerieke metingen en verbieden mismatched/partial/ongekoppelde varianten. Voordat het als live herstel geldt, moeten het beschermde GitHub-releasepad, onafhankelijke Supabase/Netlify source-SHA readback en een echte volgende oorspronkelijke hourly execution slagen.

Werkregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
