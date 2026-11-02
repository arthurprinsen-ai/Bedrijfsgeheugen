# Original ONE BRAIN labelcontract na nul-foutenprojectie
Oorzaak: originele backendrun [41433667027](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41433667027), 5.400 tests / 5.397 geslaagd / **1 mislukt** / 2 overgeslagen. Alleen historische test #3050 matchte een oude, ambigue labeltekst en was niet gesynchroniseerd met de nieuwe brongetrouwe portaalprojectie uit #5282.

Herstel: niet de beveiligde portaalcode terugdraaien. De oorspronkelijke test moet beide bedoelde bewijssoorten controleren: `Laatste vastgelegde mislukte BRAIN-run` en `Geregistreerde latere BRAIN-herstelproef`. De externe bewijslink blijft absoluut en escaped; `verifiedPassed` en klantomzet blijven onbewezen zonder eigen onafhankelijke providerreadback.

Preventie: original agent-skill/ONE BRAIN leerrecord bijgewerkt. Geen tests uitgeschakeld, geen tweede executor, geen vals groen. Broncode, backend- en portaalauthorisaties onveranderd. Protected Required+CodeQL en volledige originele BRAIN-runs op exacte commit blijven verplicht. CI-herstel != commerciële winst of levenslange geen-herhaling.
