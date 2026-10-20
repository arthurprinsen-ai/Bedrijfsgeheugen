# 12 oktober — één duidelijke verkoopboodschap, geen dubbele homepage-pitch

De nieuwe categoriekeuze is sinds PR #4342 live: Bedrijfsgeheugen is **dagelijkse ondernemingssturing**, niet een extra AI-tool. Onafhankelijke directe HTML-readback van de Nederlandse en Engelse productiehomepage bevestigde echter dat de nieuwe H1 en lead **naast** de oude kennis-/integratiepitch werden geplaatst. Het resultaat was dubbel, technisch getint en minder onderscheidend dan bedoeld.

## Correctie binnen het bestaande productiesysteem
- Bestaande Netlify site-shell projector blijft enige late HTML-authority, zonder extra buildfase of tweede homepage.
- In de live V18 hero **vervangt** één nieuwe waardepropositietekst de bestaande `hero-sub` op zijn natuurlijke plaats. De eerdere v1 extra `p.lead` wordt bij hergebruik verwijderd. Geen extra paragrafen of layoutverschuivingen.
- De hero-kicker zet **iedere dag beter sturen** vóór de techniek, in NL/EN.
- Het POWERHOUSE-blok behoudt uitleg over de technologie, maar de opsomming van losse AI-agents wordt vervangen door concrete bedrijfsvoordelen en de CTA verwijst naar de technologie erachter.
- De merkbelofte, het onderliggende bedrijfsgeheugen, bestaande scan/portaal-links, overige detailpagina's en feitelijk aantoonbare technische functionaliteit blijven behouden.

## Bewijseisen
Regressie: `tests/brain-site-shell-homepage-daily-steering-positioning.test.mjs` controleert gesimuleerde live V18 hero, Nederlandse en Engelse voordelen, oude v1-generatie, één tekstparagraaf, geen dubbele AI-agentinventaris en bestaande links. Vereist: Required en CodeQL, site-build, beschermde merge, exact gepubliceerde Netlify-commit en onafhankelijke productie-HTML-readback voor beide talen. Meet commerciële resultaten afzonderlijk; claim geen extra omzet zonder betaling en herleidbare attributie.
