# Portal V2 — één ondernemersactie vóór technische dashboards

Datum: 2026-11-05 · Eigenaar: oorspronkelijke Portal V2 UX/Engineering · Parent #4547  
Status: bronwijziging op beschermde kandidaatbranch; productie en gebruikerstesten nog niet bevestigd.

## Geobserveerd probleem
In de bestaande publieke Portal V2 startpagina stond al de originele `<details>Meer over mijn bedrijf` na de ondernemersroute. Onafhankelijke DOM-inspectie liet vervolgens `.ma-intel` en `.fsv-context` als afzonderlijke zichtbare kinderen van `main` zien. Een ondernemer zonder login zag daardoor na de ene hoofdactie toch direct analyses, scenariostudio en meerdere nulmetingen, wat de cognitieve belasting terugbrengt.

## Herstel binnen de oorspronkelijke portaalcode
- `portal-v2/app.js`: de oorspronkelijke `mountOverviewDepthDisclosure()` neemt ook bestaande late analyse- en scenario-elementen mee wanneer ze al aanwezig zijn.
- `portal-v2/modules/management-accounting-intelligence.js`: vervangt nog steeds het bestaande panel; na render wordt exact dat ene panel verplaatst naar de originele disclosure indien beschikbaar.
- `portal-v2/foresight-context-ui.js`: monteert Foresight, scenario en contextuele actievoorstellen in dezelfde bestaande `details`-content; hergebruikt bestaande auth, saved state, routes en abort-events.
- `.agents/skills/portal-living-interface/SKILL.md`: borging dat late modules de eerste ondernemersbeslissing niet opnieuw verdringen.
- `tests/brain-portal-entrepreneur-late-panels-disclosure-20261105.test.mjs`: vier broncontracttests. Geen tests zijn nog omgelabeld als live.

## Wat blijft expliciet vereist?
Voor live: originele Required, CodeQL, volledige BRAIN, beschermde merge, Netlify exact-main publicatie, onafhankelijke publieke + immutable release.json, originele DOM/mobile browser. Voor Red Dot-ambitie: consistente design system polish, 320/375/390/430/768/1024/1440 screenshots, 200% zoom, focus/keyboard, VoiceOver/TalkBack, WCAG 2.2 AA, twee echte beveiligde tenants, en minimaal vijf begeleidingsvrije ondernemers met taakvoltooiing, fouten en begrip gemeten. Award-ready wordt niet beloofd of als feit gepresenteerd.

## Preventie en rollback
Vingerafdruk `portal|ux|late-technical-panels-outside-entrepreneur-disclosure|20261105-v1`. Eerste data- en routeautoriteit blijven ongewijzigd. De standaardroll-back is het terugdraaien van deze beschermde UX-PR; geen omzet of customer outcomes verzinnen. Leren en bewijs lopen via originele ONE BRAIN en Portal V2 owner.

Bronnen: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547 en https://www.red-dot.org/bcd/red-dot-jury .
