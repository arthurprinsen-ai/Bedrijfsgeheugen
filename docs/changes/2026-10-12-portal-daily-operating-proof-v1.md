# Portal V2 — dagelijkse ondernemingssturing vóór AI-functionaliteiten

Op 12 oktober werd de NL/EN-website propositie gewijzigd naar **dagelijks sturen op veranderingen, gevolgen, besluiten, uitvoering en resultaten**. De live Portal V2 op https://www.bedrijfsgeheugen.nl/portal-v2/ bleef nog techniekgericht: Powerhouse Connect/Intelligence/Agents, dashboardwidgetjes en kale demo-getallen bovenaan.

## Reparatie in bestaande Portal V2
- De eerste portaalervaring toont de **ondernemingscyclus** in vijf direct werkende links naar dezelfde bestaande route-registry en router. Geen tweede menu, geen extra data- of executionservice.
- **Signalen:** omgevingsradar; **Impact:** bedrijfssituatie; **Beslissen:** strategie-naar-maandagochtend; **Uitvoeren:** actieve-acties; **Leren:** outcomes-evidence.
- Bovenaan staat wat het portaal de ondernemer helpt doen; Connect, Intelligence, Agents blijven als onderliggende capabilities bereikbaar. De interactieve animatie wordt correct als **voorbeeld** aangeduid.
- Statisch verzonnen scores, winst, aantallen opdrachten en activiteiten zijn **demo-only**, standaard verborgen; pas expliciete demo-context laat ze zien met waarschuwing. Klanten met aantoonbaar ingevuld profiel zien alleen het eigen, afgeleide profiel-KPI-overzicht; de statische vijfde AI-score is altijd verborgen voor echte klanten. Zonder klantgegevens geen valse '72/100', '€1,24M waarde' of '23 afgerond'.
- De bestaande legacy-overview, klantcockpit, domeinstate, stateclient, consent, actiebevestiging, uitvoeringsrechten, auth en single navigation authority worden niet gewijzigd. Geen bewijsloze observatie van externe veranderingen en geen claim dat het systeem opdrachten of geld heeft gegenereerd.
- De enige visuele aanpassing zit in bestaande `portal-v2/experience.css`; mobiele navigatie blijft identiek.

## Bewijseisen
Test `tests/brain-portal-daily-operating-truth-v1.test.mjs` controleert vijf canonieke doelen, toegankelijke links, responsiviteit, placeholder-afscherming en drie soorten bewijscontext. Vereist: beschermd CI, portal-/website-preview, authentieke route-clickchecks, main-merge, identieke Netlify commit en live DOM readback inclusief mobiele breedte. Conversie/omzet worden uitsluitend apart gemeten na werkelijke contact- en orderresultaten.
