# Onderzoeksboekhouding: index op productie bewezen

Obligation-ID: portal|bounded-internal-research-economics|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Predecessors: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4540 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4551

De functiecorrectie was al toegepast als 20261020112220, maar de afzonderlijke index stopte op SQLSTATE57014. Het echte dashboard toonde Nano (maximaal 0,5GB), Unhealthy, Database not usable/TCP CONNECT_TIMEOUT5002ms en een bijna opgebruikt DiskIO-budget. Dit providerbewijs verklaart waarom alleen querycode en extra pogingen niet voldoende waren; het bewijst geen exclusieve oorzaak voor iedere eerdere time-out.

Na expliciete goedkeuring is eenmaal de aangeboden kosteloze Nano→Micro-upgrade met automatische herstart uitgevoerd. Beide prijzen waren $9,68/maand, verschil $0; Micro heeft 1GB geheugen. Geen betaalde capaciteitsverhoging, spend-capwijziging, grotere timeout of uitgeschakelde scheduler. Daarna meldde de provider ACTIVE_HEALTHY en slaagde exact dezelfde beschermde index-SQL met 2s lock- en 20s statementbudget.

Productie-readback 2026-10-20T13:29:48.586178Z: kandidaatindex valid/ready=true; de echte queryplanner gebruikt deze index en de bestaande unieke economics-action_id-index voor deduplicatie. EXPLAIN ANALYZE gaf 9,098ms uitvoering en nul resterende kandidaten; de echte functie gaf 0 terug. Functiebody-MD5 c35271d16bfeba495bf70dea956fc3bb, anon/authenticated EXECUTE=false, service_role=true, cron171 actief. De ongewijzigde functie verwerkte in de eerdere rollback-only previewtest 123 historische acties als [50,50,23,0]. Productie bevat geen synthetische testacties.

De provider kent de indexpoging versie 20261020132933 toe. Deze bronspiegel bevat exact de opgeslagen SQL, bytegelijk aan beschermd 20261020112221, SHA256 6fc393681c29bd28bf3af41b88f31d8b6e5a180622b4820a7f6e90b534a3751b. De oorspronkelijke bronversies blijven behouden; er is geen productiehistorie herschreven of een niet-toegepaste versie als APPLIED voorgesteld. Normale replay kan IF NOT EXISTS gebruiken. De regressie faalde eerst op de ontbrekende provider-identiteit en slaagt nu met alle negen historie-/volgordecontroles.

Brain learning bevat providerbewijs, toestemming, resultaat en preventieregel; bestaande skill-projectie en System Map blijven eigenaar, zonder nieuwe component of executor. De oorspronkelijke onbeperkte onderzoeksverwerking en de aanvullende index zijn hiermee op productie bewezen. Dit sluit de brede portaal-/tweeklantacceptatie van #4215 niet af. De gemeten versnelling volgt zowel infrastructuurherstel als indexaanleg; geen zuivere index-only A/B-claim.

## Gelijktijdige provider-identiteit
De verse volledige productiehistorie bevat ook 20261020133013_p0_4215_portal_read_sort_indexes. De opgeslagen SQL is bytegelijk aan het reeds beschermde 20261020113000-bestand. Deze tweede exacte bronspiegel voorkomt een nieuwe remote-only-historyfout; er is geen nieuwe portalindex ontworpen of door deze followup geforceerd. Een aparte red-first regressie faalde op de ontbrekende spiegel en bewaakt nu exacte gelijkheid. De bestaande oorspronkelijke versie blijft behouden.
