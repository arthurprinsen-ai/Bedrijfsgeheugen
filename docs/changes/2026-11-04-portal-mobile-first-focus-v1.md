# Portal V2 — UX root-cause en mobile-first focus v1 (2026-11-04)

**Classification:** UX quality debt / in review. **Not live-proven.** Existing ONE BRAIN, portal-state and Powerhouse authorities remain unchanged.

## Gebruikersprobleem
De ondernemer ervaart het portaal als ingewikkeld en op mobiel onvoldoende intuïtief. In de geinspecteerde hoofdroute `/portaal` heeft `portal-v2/index.html` direct een technische vijfstaps-sturing, uitgebreid bronnendiagram, verschillende overzichten en een volwaardig paginaregister. Daarnaast presenteert de ondernemersroute dezelfde vervolgstap op meerdere plekken. Daardoor wordt de eerstvolgende beslissing slecht zichtbaar. De bestaande mobiele weergave biedt geen vaste taakgerichte navigatie.

## Gewijzigd in deze PR
- Op de bestaande geauthenticeerde ondernemersroute staat **één primaire vervolgstap** direct na de welkomstkop.
- De zeven bestaande ondernemersdoelen blijven bij de eerste kennismaking rechtstreeks bereikbaar; geen nieuw datamodel en geen extra opslagsysteem.
- Prioriteit, nulmeting, bewijs, scenario's en beheersinformatie blijven beschikbaar in een native toetsenbordbedienbaar `<details>`-paneel; in- en uitklapstatus wordt alleen in geheugen bewaard (niet over tenants heen).
- De mobiele basisnavigatie toont **Vandaag · Acties · Resultaat · Meer** en verwijst uitsluitend naar de bestaande beveiligde router. Geen tweede navigatie- of authenticatieautoriteit.
- Desktopgroepen worden met native `<details>/<summary>` ingeklapt; actieve route blijft zichtbaar.
- Aanraakvlakken en safe-area-randen worden op telefoons gerespecteerd. `prefers-reduced-motion`, toetsenbordfocus en VoiceOver-bereikbaarheid blijven ontwerpverplichtingen.
- Geen fictieve cijfers, verzonnen besparingen, ‘groene’ agentstatus, ongeautoriseerde uitvoering of versoepeling van tenantisolatie.
- Regressie: `portal-v2/tests/entrepreneur-focus-mobile.test.mjs` naast bestaande homepage-, journey-, mobiele-shell- en routetests.

## First-time-right bewijs en releasepoort
**Voor protected merge**: Node-syntax op alle gewijzigde modules; nieuwe en bestaande V2-tests groen; oorspronkelijke Required, CodeQL en BRAIN waar vereist; geen regressie voor inloggen, tenantwissel, demo-/klantscheiding, routebescherming en semantische statistieken.

**Visuele en gebruiksacceptatie** (nog vereist, dus niet als groen claimen): test op 320/375/390/430 px én tablet/desktop, staand/liggend; geen horizontale scroll, tappable controls minimaal 44 × 44 CSS-pixels, leesbare tekst en contrast WCAG 2.2 AA; iOS VoiceOver en toetsenbord; focus/scroll in geopend detail en bij de eerste doelkeuze; geen overlay door dock met iOS safe-area; herladen/deeplinks en terugknop. Laat minimaal vijf ondernemers zonder instructie aangeven: wat gaat goed/slecht, wat moet ik als eerste doen en waar zie ik bewezen resultaat. Meet taakvoltooiing, fouten en frictie, in plaats van een awardclaim vooraf.

**Na merge**: onafhankelijke Netlify productiedeploy-SHA, `/portaal`-route en mobiele readback, gevolgd door een echte geauthenticeerde klanttaak. Pas daarna LIVE VERIFIED. Laat het nieuwe menu niet als afgerond gelden zolang het bestaande omvangrijke dashboard buiten de persoonlijke route nog zichtbaar blijft of de 5-seconden-test faalt.

## Leren en preventie
**Fingerprint**: `portal|ux|technical-dashboard-before-entrepreneur-decision|20261104-v1`.
Owner: oorspronkelijke Portal V2 UX/Engineering agent in ONE BRAIN; geen parallelle agent of scheduler. Registreer oorzaak, screenshot/videobewijs per viewport, gevalideerde remediatie, tests, deploy, resultaat en eventuele terugval. De hoofdnavigatie mag niet opnieuw uitgroeien tot een zichtbare catalogus van tientallen links; nieuwe functies worden standaard via contextuele verdieping ontsloten.

**Openstaande scope**: de legacy-overview, de technische vijfstaps-flow en verdere pagina's verdienen een afzonderlijk, op daadwerkelijke gebruikersmetingen gebaseerd ontwerptraject. Deze PR is een eerste laag, geen Red Dot-certificering.

## Uitbreiding: ook het oorspronkelijke technische startscherm vereenvoudigd

De eerste focuskaart alleen was niet voldoende: de bestaande vijfstappensturing en het bronverwerkingsdiagram bleven direct eronder zichtbaar. Op dezelfde oorspronkelijke route verplaatst `mountOverviewDepthDisclosure()` de bestaande DOM-onderdelen `.daily-steering`, `.kpis`, `.dashboard`, `.lower` en `.activities` onder een native uitklapbare sectie **Meer over mijn bedrijf**. Niet verwijderen, dupliceren of uit de authorized route laten verdwijnen. Voor de SVG-flow vindt bij openen opnieuw een layout/render-pass plaats. Bij andere routes sluit de sectie. Daarmee ligt het primaire ondernemersbesluit standaard vóór de technische context. Automatische mobiele en toegankelijkheids-acceptatie blijft nodig.

## GitHub-beveiligingsincident blijft onafhankelijk open

Na geslaagde PR Required #41799903229, CodeQL #41799902856 en Netlify-preview gaf beschermde squash-merge op SHA `c4a058ee4361069f9c47c788bbfebf87f4cfc2af` HTTP405: **3 of 3 required status checks are expected**. Bij onafhankelijke read-only inspectie had de virtuele mergecommit `164de529ddf31f0c9e802a6af48c971d34d0894f` nog 0 Check Runs en 0 Commit Statuses. Exacte vereiste names/integration-App-IDs niet leesbaar via de huidige connector (HTTP403 branch protection); GitHub main was verder gegaan. De verplichte herstelroute ligt onder incident #4929 bij de oorspronkelijke Recovery Supervisor / bevoegde rules-beheerder; geen checkbypass, force merge, alternatieve PR of vals groen. Deze UX-wijziging blijft **NIET LIVE** tot beschermd merge, actuele Netlify published-SHA en echte gebruikersreadback.
