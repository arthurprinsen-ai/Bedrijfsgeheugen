# Koppelingenbouwer — Powerhouse / Brain closed-loop contract

Status: canonical contract, geldig voor alle huidige en toekomstige koppelingen.

Productiebaseline:
- canonical productie-PR: #1150
- exact groen geteste candidate-head: `c7529e4f49b1ffb20cec7abcf692e4a9e91cef30`
- productie-merge-SHA: `19c6f7fc108ea7805c78945906a9a57bec5d4b9e`
- Netlify production deploy: `6a9fc8e2a3d0080008c16732`
- Production Release Readback: run `34205349430`, success

## 1. Doel

Een gebruiker moet een koppeling kunnen bouwen zonder technische kennis. De gebruiker beschrijft wat er moet gebeuren; de AI helpt bij bron, filtering, extractie, bestemming, frequentie en validatie. Het systeem mag technische complexiteit verbergen, maar nooit technische waarheid verbergen.

Daarom geldt: een koppeling is pas `ready`, `active` of `healthy` wanneer dat door echte configuratie en execution evidence is bewezen.

## 2. Vaste closed loop

Iedere koppeling doorloopt dezelfde lus:

`signaal/aanvraag → configuratie → safe-test → readiness → activatie → echte uitvoering → resultaatcontrole → execution evidence → portal health → foutdetectie → recovery → root cause → regression/prevention → learning → BG168 → BG166 → volgende uitvoering`

Geen stap mag de opvolgende bewijsstap overslaan.

## 3. Rollen van de lagen

- **Portaal** — gezicht en bediening. Toont alleen evidence-backed status, eenvoudige instructies en herstelactie.
- **AI-guide** — vertaalt gewone taal naar configuratievoorstellen. Mag adviseren en configureren, maar nooit zelfstandig `ready/healthy` verzinnen of secrets tonen.
- **Connector runtime** — voert source → processing/extraction → validation → target uit.
- **Document extractor** — server-side extractie; providersecret blijft server-side.
- **Supabase / connector store** — duurzame definitie-, execution- en recovery-evidence.
- **Powerhouse** — uitvoerende en herstelende laag. Signaleert, prioriteert, voert uit, test, herstelt en bewaakt.
- **BG211** — operationeel event-/zenuwpad waar beschikbaar.
- **BG168** — canonical outcome & learning router.
- **BG166** — canonical error & learning ledger.
- **Notion** — menselijke besluit- en werkdocumentatie; geen runtime-status of klantsecrets.

## 4. Statuscontract

De statussen betekenen exact:

- `available`: adapter/capability bestaat technisch.
- `configured`: vereiste server-side configuratie/credentials zijn aanwezig.
- `ready`: provider of target is aantoonbaar bereikbaar en een veilige test is geslaagd.
- `active`: activatie is expliciet uitgevoerd nadat readiness is bewezen.
- `healthy`: een recente echte execution is succesvol en bevat evidence-id/execution-id.
- `action-required` / `degraded` / `error`: er is concrete evidence voor een probleem of ontbrekende verplichte stap.

Nooit een hogere status afleiden uit alleen het bestaan van code, UI, een toggle of een template.

## 5. Activatie-invariant

`active` mag alleen wanneer:
1. definitie geldig is;
2. bron geconfigureerd is;
3. verwerking/extractie geconfigureerd is;
4. target geconfigureerd is;
5. safe-test is geslaagd;
6. test-evidence hoort bij de actuele configuratieversie;
7. geen open blocking recovery-obligation bestaat.

Elke configuratiewijziging maakt oude safe-test evidence ongeldig totdat opnieuw is getest.

## 6. Evidencecontract

Een succesvolle test/execution bevat minimaal de geordende bewijsstappen:

1. `source`
2. `extractor` / `processing`
3. `validation`
4. `target`

Iedere stap bevat timestamp en een trace/evidence-id. De totale ronde bevat één execution-id. Het portaal toont de stap waar een fout ontstond, niet alleen een generieke foutmelding.

## 7. Security en secrets

- Secrets uitsluitend server-side.
- OAuth gebruiken waar mogelijk; geen token-paste wanneer een normale accountverbinding beschikbaar is.
- Readiness-response bevat nooit secretwaarden of secretachtige velden.
- Geen secrets in browser, portal state, logs, Notion of learning payloads.
- Productie-secret scan blijft release-evidence.

## 8. Fail-closed providerregel

AFAS, Exact en iedere toekomstige externe provider blijven `not-configured` zolang de echte providerconfig ontbreekt.

Voor AFAS is minimaal nodig: omgeving, server-side token, connectornamen/scopes en gecontroleerde nondestructieve safe-test.

Voor Exact is minimaal nodig: OAuth/appconfig, division/company context, scopes en gecontroleerde safe-test.

Geen placeholder-URL, statische mock of sample telt als provider-readiness.

## 9. Fout- en recoverycontract

Een mislukte safe-test of execution wordt altijd persistent vastgelegd met:
- execution-id;
- connector-id;
- foutstadium;
- foutcode/foutklasse;
- timestamp;
- relevante niet-gevoelige context;
- recovery-obligation;
- dedupe fingerprint.

Recovery is verplicht:

`detectie → containment → root cause → minimale veilige fix → regressietest → nieuwe safe-test/execution → live readback → recovery resolved → prevention/learning`

Een disable/pause/quarantine is containment, nooit eindstatus.

Retries zijn begrensd; geen oneindige retrylus en geen credit-burning.

## 10. Learningcontract

Iedere betekenisvolle uitkomst levert één dedupebare learning op wanneer die structureel iets leert over ontwerp, configuratie, provider, UX, recovery of release.

Learning payload bevat minimaal:
- `fingerprint`
- `scope`
- `trigger`
- `observed_outcome`
- `root_cause`
- `decision`
- `prevention`
- `evidence`
- `owner`
- `status`

Learning wordt via canonical route BG168 → BG166 geschreven. Zonder execution evidence mag Brain-writeback niet als voltooid gelden.

## 11. Canonical open Brain replay obligation

Make-status op 8 september 2026:
- BG168 scenario `7136176` — status `paused`, `isActive=true`, on-demand.
- BG166 scenario `7135971` — status `paused`, `isActive=true`, on-demand.

Daarom is de learning voor deze release nog niet aantoonbaar in BG166 geschreven.

Open obligation:
- fingerprint: `connector-ai-wizard-powerhouse-closed-loop-v1`
- owner: `Powerhouse Learning / Brain writeback`
- route: `BG168 7136176 → BG166 7135971`
- replay: exact één keer zodra Make weer uitvoerbaar is
- dedupe: verplicht; geen dubbele ledger-entry
- completion evidence: succesvolle BG168 execution + aantoonbare BG166 ledger-write

Tot dat moment zijn dit document en de gekoppelde Notion-besluitpagina de duurzame continuity-bronnen, maar niet een vervanging voor canonical Brain-writeback.

## 12. Releasecontract

Geen koppelingenwijziging is klaar bij code of merge alleen.

Verplicht:

`branch/PR → tests → browser/mobile regressie → merge met exact-head bescherming → Netlify exact SHA → live readiness → production browser/readback → outcome check → learning/prevention`

De productie-SHA van Netlify moet exact gelijk zijn aan de bedoelde merge-SHA. "Waarschijnlijk live" of "deploy gestart" telt niet.

## 13. UX-contract

De default gebruiker ziet taken, geen techniek:
- “Wat wil je automatisch laten gebeuren?”
- taakgerichte templates
- gewone taal
- veilige defaults
- korte inline uitleg
- extra `?`-uitleg
- mobiel tapbaar, geen hover-only kritieke informatie
- minimaal 44px interactieve tappunten
- geavanceerde API/database/mappingdetails alleen indien nodig

AI mag de gebruiker helpen kiezen en fouten verklaren, maar de evidenceketen blijft leidend.

## 14. Reference flow

Canonical referentie:

`Outlook/Microsoft 365 → PDF attachment → document extraction → validation → Datahub`

Voorbeeld gebruikerspad:
1. Microsoft-account verbinden.
2. Mailbox/map kiezen.
3. PDF-filter kiezen.
4. Optioneel afzender/onderwerp filteren.
5. Documenttype/velden kiezen of door AI laten voorstellen.
6. Bestemming kiezen.
7. Frequentie kiezen.
8. Test met echte of veilige representatieve data.
9. Vier evidence-stappen tonen.
10. Pas daarna activeren.
11. Iedere echte run teruglezen en health bijwerken.

## 15. Definitie van klaar

Een koppeling of wijziging is alleen klaar wanneer:
- functioneel gedrag is gebouwd;
- relevante regressietests groen zijn;
- configuratie veilig is;
- safe-test groen is;
- echte execution evidence bestaat waar de status dat vereist;
- portalstatus overeenkomt met bewijs;
- productie exact de bedoelde SHA draait;
- live readback groen is;
- failures een recoverypad hebben;
- structurele learnings zijn vastgelegd of als expliciete replay-obligation openstaan.
