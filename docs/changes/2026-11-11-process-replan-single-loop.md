# Portal V2 — wijzig eigenaar en planning in bestaande proceslus

11 november 2026. Fingerprint `portal|process|owner-deadline-cannot-replan-without-dropping-lineage|20261111-v1`.

## Oorzaak en herstel
De vier procesvormen boden wel een startformulier maar geen mogelijkheid om de procesverantwoordelijke of doelplanning te corrigeren. Nieuwe eigenaar en einddatum zijn nu aanpasbaar op dezelfde proceskaart. De oorspronkelijke `portal.deliveryPlan` blijft de enige schrijver: de bestaande DomainState-flush, beveiligde BusinessInput/ONE BRAIN-route, tenant en bronrevisie blijven leidend.

Bij wijziging van eigenaar worden alleen ongewijzigde of lege stapverantwoordelijken aangepast; een expliciete gespecialiseerde eigenaar blijft behouden. Een nieuwe einddatum herberekent alleen de bestaande sjabloondeadlines. Verwijderen van de einddatum wist geplande datums, niet de taak zelf. Historische intent-ID's, door gebruiker opgegeven uitvoerstatus, goedkeuringsverzoeken en bewijsreferenties blijven intact. De nieuwe wijziging vereist opnieuw onafhankelijk Brain-ontvangstbewijs.

## Niet aangetoond
Dit is geen goedkeuringsprovider, geen herinneringsscheduler, geen uitgevoerde bestelling, geen onafhankelijke Heartbeat-uitkomst en geen autonome commerciële leeruitvoering. De zeven rode loops worden niet door deze bronwijziging groen.

## Acceptatie
Originele portal-tests plus `tests/brain-process-replan-20261111.test.mjs`, beschermde GitHub Required, BRAIN, CodeQL, System Map, exacte Netlify SHA en onafhankelijke productie-browser-readback. Geen eigen tenant of admin rechten op basis van deze klantformulieren.
