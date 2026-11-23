# Portal V2 — mobiele volledige menudialoog: behoud context en focus (4 november 2026)

Owner: oorspronkelijke Portal V2 UX/Engineering, parent #4547. Bron: live app.js en bestaande Playwright mobile shell. Status: **CODE CANDIDATE**, geen claim dat productie vernieuwd is.

## Geobserveerd probleem en oorzaak
De oorspronkelijke vier-tab mobiele navigatie opende het bestaande volledige menu als `role="dialog"`. Bij Escape, sluiten of backdrop werd de ondernemer zonder uitzondering teruggestuurd naar `overzicht`, ook vanuit een andere pagina. Het menu liet focus op de oorspronkelijke pagina kunnen ontsnappen en borgde focus niet bij sluiten. `aria-modal=true` zonder achtergrondafscherming was een ontoereikende toegankelijkheidsbelofte.

Fingerprint: `portal|mobile-ux|dialog-loses-route-and-focus|20261104-v1`.

## Reparatie binnen dezelfde bronautoriteit
- Behoud laatste niet-hub-route **alleen in geheugen** via `subscribePortalRoute`; geen opslag, tenantlek, nieuwe router of scheduler.
- `openHub`: bewaar oorspronkelijke focus, scherm de `.app` met `inert` af zolang de dialoog open is, focus de echte sluitknop en stel de bestaande triggerstatus toegankelijk in.
- Escape, sluitknop en backdrop gebruiken één `dismissHub` die de vorige route behoudt en de oorspronkelijke zichtbare menuknop weer focust.
- Tab en Shift+Tab blijven in de werkelijke dialoog; echte navigatie naar een gekozen pagina blijft de bestaande beveiligde `navigatePortal`/page-registry gebruiken.
- `closeHub` herstelt oorspronkelijke `inert`-toestand zonder bypass van login/tenant/role guards.
- Geen klanten-KPI, bronbewijs, portaalwijziging of resultaat wordt gesimuleerd of groen gekleurd.

## Testcontract en uitrol
- Bestaande `tests/integration/portal-v2-mobile-shell.spec.js`: echte 390px hydration, sluitknopfocus, Tab-cyclus, Escape-terugfocus, `aria-expanded`, achtergrondsper en terugkeer naar oorspronkelijke pagina.
- Oorspronkelijke Required, CodeQL, BRAIN, System Map-integriteit en beschermde merge verplicht; daarna exact Netlify published SHA en echte production DOM/browser readback, niet alleen tests die broncode lezen.
- Openstaand onafhankelijk bewijs: iPhone VoiceOver/Android TalkBack, 320/375/390/430, 200% zoom, vijf ongeleide ondernemers en volledige WCAG 2.2 AA. Geen claim van Red Dot-certificering.
- Historische fouten blijven bewaard; pas status op basis van echte onafhankelijke productiecontrole aan.

## Preventie
Elke toekomstige `role=dialog aria-modal=true` in Portal V2 moet focus bij opening, cyclische keyboard-focus, inert achtergrond, veilige Escape-/backdrop-/sluitactie, bronroutebehoud en terugfocus bewijzen. Toekomstige mobiele navigatiewijzigingen hergebruiken deze regressie, geen tweede mobiele menustructuur.


## Productiebrowser-replay: origineel testcontract en overlay-pariteit
De oorspronkelijke protected PR #5422 is echt gemerged (`176315de3738a1f59479fb137eae932531d27ae6`) en Netlify deploy `6aeb53a0a8ed72ff08c447fd` is gepubliceerd. De bestaande productiebrowser `41861441439` liep de eerste mobiele focus/Tab/Escape-assertions door, maar de aanvullende terugroute-test faalde bij `#allPages` nog gesloten.

Oorzaak 1 (test): een naakte `import('/portal-v2/router.js')` zonder de in `app.js` gebruikte query-pinning maakt in ES-modules **een tweede ongeïnitialiseerde routerinstantie**. Een URL-mutatie door die instantie betekent niet dat de oorspronkelijke app een dialoog opende. De test roept nu de werkelijke reeds door `app.js` gebonden nav-knoppen aan.

Oorzaak 2 (UX): het openen van het volledige menu vanuit een specialistische pagina kan het onafhankelijke `#portalView`-paneel zichtbaar houden. De oorspronkelijke `openHub` sluit dat paneel eerst met de bestaande `closePortalPage()`, zonder de canonical URL, state of gebruikersrechten te verliezen. Bij ontslaan van het menu wordt dezelfde oorspronkelijke route opnieuw gerenderd.

Regressie: de originele 390px productiebrowsertest controleert het werkelijke menu en dat de specialistische overlay `aria-hidden=true` is. De originele Brain-regressie verbiedt een losse router-import in de browserproef. Geen test skip, geen lagere WCAG-eis of tweede executor. **Nieuwe bronwijziging vereist eigen protected CI, gepubliceerde exacte Netlify SHA en originele volledige browseruitvoering.**
