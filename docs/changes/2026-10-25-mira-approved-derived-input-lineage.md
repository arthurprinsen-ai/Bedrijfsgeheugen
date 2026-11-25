# Mira — afgeleide 9:16-referentie veilig gebruiken in oorspronkelijke videoproducer

## Onafhankelijk bewezen 25 oktober 2026

Gegevens uit de bestaande productie-verifier: `net._http_response.id=12791`, HTTP 200, echte twee-afbeeldingenvergelijking met onveranderde oorspronkelijke Mira-master. De afgeleide OpenArt-afbeelding `4aOsUdQyAheL3wmex9Uq` is precies 1296x2304, originele bestands-SHA `242119866b6eaf9c142331e46b878df08c4f206fb4106fab2f48065b121b3b0a`. Het gezicht scoorde **0,950**, minimum **0,940**. De originele master-ID en oorspronkelijke master-SHA zijn ongewijzigd.

Het foto-identiteitsbewijs blijft `reference_candidate_verified` en voor Instagram `UNPROVEN`; de datum heeft nog geen werkelijke Meta-ID. De test bewijst visuele overeenkomst, geen pixel-identieke oorspronkelijke foto en geen goedgekeurde video.

## Afbakening

De bestaande originele media-router moet `generation_preflight` met `derivedReference` beoordelen. Alleen de exacte goedgekeurde history, resource-ID, OpenArt-URL en SHA worden toegelaten, en alleen als de onafhankelijke bewijsregel in het productieregister nog steeds voldoet, de bevroren parkeerapps-bron en originele master overeenkomen, de gekozen videomodus bewezen 9:16/no-audio ondersteunt en de bestaande budgetlimiet geslaagd is. Een ander beeld, een gemanipuleerde SHA, onleesbaar bewijs of een gezichtsresultaat onder 0,940 wordt geweigerd.

Bij `submit_asset` moeten deze bewijsvelden opnieuw uit het bestaande register worden geladen; de werkelijke provider-input krijgt expliciete afstammingsmetadata `mira_derived_generation_input`. De originele `openart_reference_id` blijft de onveranderde officiële gezichtsnorm, niet een misleidende claim dat de oorspronkelijke foto als feitelijke generatie-input is gebruikt. De oorspronkelijke start/midden/eind-beeld- en bewegingsverificatie plus echte Meta-readback blijven verplicht.

De foto laat volgens de vision-verifier Mira aan een bureau met een mok zien. Het bevroren contentverhaal van 25 oktober gaat over parkeren met meerdere telefoonapps. Dit is een **inhoudelijk scèneverschil** dat de originele producer vóór nieuwe videokosten moet beoordelen; een opgegeven prompt alleen is geen bewijs dat de uiteindelijke video het verhaal laat zien.

## Acceptatie

Test `tests/brain-mira-pinned-derived-generation-input-20261025.test.mjs`, Required+CodeQL op exact PR-head, native Supabase-preview, beschermde merge en echte productie-readback, plus gecontroleerde generation_preflight met exacte afbeeldings-SHA. Een geslaagde preflight is slechts toestemming tot één budgetpassende nieuwe providerkandidaat, geen Instagram-publicatie.
