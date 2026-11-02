# Append-only ontwikkelgebeurtenis — 2 november 2026

Obligation-ID: portal|entrepreneur-value-evidence-first|20261102-v1
Fingerprint: website|portal|entrepreneur-value-buried-behind-technical-copy|20261102-v1
GitHub kandidaat: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5248
Bron: bestaande homepage, Netlify copyprojectie, Portal V2 tenantgebonden ondernemersroute.

## Observatie
De eerste ondernemersindruk bleef te technisch; bestaande bronbewuste ondernemersroute was onvoldoende prominent. Publieke demo-/voorbeeldgegevens mogen geen klantwaarde claimen.

## Ingrepen
Laat de bestaande laatste websitepositioneringsfase een eigenaargerichte NL/EN-ingang toevoegen. Toon in bestaande geauthenticeerde Portal V2-home alleen brongebonden volgende stap, bronkwaliteit en uniek geverifieerde uitkomsten. Geen nieuwe Brain/Heartbeat-state, klantdatabase of executor.

## Voorkomen/herhalen
Nieuwe regressies voor NL+EN, dubbele build, authenticatiegrens, nuldata en bewijsstatus. Skill in bestaande documentatiemap. Reviewer en GitHub-Required bepalen definitieve toelating.

## Eerste CI-incident
De eerste Required-admission van PR #5248 faalde met `PR_MACHINE_METADATA_INVALID` doordat verplichte machinevelden ontbraken in de PR-body. Oorzaak: kandidaat aangemaakt met vrije toelichting zonder verplichte admissionheaders. Herstel: volledige, exacte `Obligation-ID`, `Delivery-Lane`, `Candidate-Type`, `Base-SHA`, `Change-Scope` en `Scope-Budget` toevoegen in dezelfde PR. Preventie: machineheaders vanaf creatie verplicht; nooit admission omzeilen.

## Bewijsstatus
CODE_CANDIDATE; geen exact beschermde merge, Netlify live readback of statistisch valide betaalconversieresultaat vastgelegd. Alleen na bestaande protected route en onafhankelijke broncontrole promoten.

## Tweede CI-incident — learning en System Map
Na toelating faalde de oorspronkelijke, correcte canonical-learning check op `LEARNING_EVALUATION_TEST_PATH_INVALID`: het historische replayveld verwees naar een portaal-lokale test buiten de toegestane `tests/`-namespace. De aparte portaalcomponenttest blijft behouden, maar het machineveld `historical_replay` wijst nu alleen naar de canonieke `tests/`-test. De volgende Required-run had admission groen, maar preflight detecteerde `SYSTEM_MAP_INTEGRITY_FAIL`: de nieuwe skill vergrootte de originele skill-inventory en wijzigde `explanationInventory.contentHash`. De bestaande System Map is exact bijgewerkt van `d87ba7a7eb52be99141f36c5ee0f23d8a876852a25f6e598c019f621049bfe57` naar het door de vertrouwde generator aangetoonde `53fedb8dfef7ea17882b877aff5955cb49374ad278296308e603b858c925b82c`. Geen validator uitgeschakeld; release blijft onbewezen tot verse CI en daadwerkelijke Netlify readback.


## Originele ONE BRAIN registratie en actuele hoofdbranch
Via oorspronkelijke Supabase-project `adhjwmvyoixzjtmiroln` zijn drie echte CI-foutobservaties door `public.brain_observe_failure` ingeschreven en onmiddellijk teruggelezen: elk `OBSERVED`, `occurrence_count=1`. Bewijslocaties: Required-runs 41402742631, 41402955306 en 41403060983. Geen handmatige opwaardering van maturity; idem bij een herhaling een nieuwe oorspronkelijke observatie binnen dezelfde fingerprint.

Tijdens de uitvoering werd `main` `285dab223d18eb9ec26d649f99a4b0279b98527e` door de beschermde eerdere portaalverbetering #5247. De nieuwe kandidaat is op die actuele bron gesynchroniseerd met behoud van oorspronkelijke Executive Cockpit klantwaardebriefing, bestaande portaalautorisatie, versieerbare verhaallijnen, Netlify- en Supabase-readmodels. De originele PR #5248 blijft de opleverlijn; tijdelijk stagingbranch is geen parallelle executor, publicatieroute of tweede portaal. De uiteindelijke PR-HEAD, exact geproduceerde System Map hash, CodeQL/Required, Netlify SHA en onafhankelijke tenantoutcome worden apart gecontroleerd.


## Derde visuele regressie: fold-occlusie op alle schermformaten
Original protected browser job `125148273211`, Required-run `41405603611`, detected after all-public-pages en menus dat de initiële viewport op de homepage onzichtbare content had op phone/tablet/desktop/wide: `UI visual regression failed: / ... initial visible-ratio`. Oorzaak: nieuw ondernemerswaarde-blok werd voor de originele hero gezet en duwde de oorspronkelijke H1 uit het eerste scherm. Reparatie in de originele `tools/site-shell/apply-daily-steering-positioning.mjs`: nieuwe waarde-uitleg *na* de bestaande eerste hero renderen; NL/EN idempotente hero-first regression toegevoegd. Originele Netlify agent-skill bijgewerkt en oorspronkelijke Brain-fingerprint `website|first-fold|value-section-pushes-homepage-hero-offscreen|20261102-v1` idempotent als `OBSERVED` ingeschreven en onafhankelijk teruggelezen. Release-status blijft onbewezen totdat de oorspronkelijke protected browser-check en exact-SHA productie Netlify readback daadwerkelijk groen zijn.
