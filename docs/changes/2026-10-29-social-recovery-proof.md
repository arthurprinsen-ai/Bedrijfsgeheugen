# 29 oktober 2026 — publicatie-agents herstellen zonder dubbele verzending

## Wat was er mis?
In de bestaande publicatielus werd alleen gekeken naar kanalen waarvan het besluit nog `publish` was. Zodra LinkedIn persoonlijk na een echt inhoudsduplicaat naar `hold` ging, kon de herstelcontrole dat kanaal buiten de beoordeling laten. Daardoor kon een groen dagresultaat ontstaan terwijl de persoonlijke post nog niet live was.

Voor Instagram bleek bovendien de overdracht tussen systemen onvolledig: OpenArt had de video voor 29 oktober gegenereerd, maar het oorspronkelijke Powerhouse-mediaverzoek bleef op `GENERATING`. Een voltooide videobewerking is nog geen goedgekeurde Mira-video en zeker geen gepubliceerde Reel.

## Wat is aangepast?
De bestaande `social-recovery-runner` gebruikt nu een aanvullende controle. Alleen een vooraf geweigerd duplicaat zonder mogelijke providerverzending mag de bestaande contentverwerking opnieuw activeren. Een nieuw verhaal moet aantoonbaar een andere, echte, ongebruikte persoonlijke gebeurtenis of verifieerbare observatie zijn. Een andere formulering van hetzelfde voorval telt niet.

Voor het dagresultaat moeten LinkedIn persoonlijk, LinkedIn bedrijf en Instagram elk een echte publicatie-ID én onafhankelijk gecontroleerd bewijs van publicatie hebben. Een geaccepteerd verzendverzoek, een uitgestelde actie of een onvolledige mediataak telt niet als afgerond.

## Wat moet de Mira-producer doen?
De bestaande OpenArt-opdracht wordt op haar eigen historie-ID gecontroleerd. Bij `COMPLETED` draagt de bestaande producer het exacte videobestand over aan de bestaande Instagram-media-router. Die controleert het echte MP4-bestand, de oorspronkelijke afmetingen, de identiteit van Mira in begin/midden/eind (minimaal 0,940), de natuurlijke beweging (minimaal 0,900) en de goedgekeurde inhoud. Pas daarna mag de bestaande Instagram-publisher publiceren. De echte Instagram-ID en permalink moeten teruggelezen worden.

Bij een herhaalbare providerstoring kan een begrensde retry; bij een afgeronde opdracht mag geen onnodige nieuwe betaalde generatie worden gestart. Bij ontbrekende menselijke toestemming blijft het kanaal afzonderlijk open terwijl de andere kanalen doorgaan.

## Wanneer heet dit opgelost?
De nieuwe code moet de beschermde GitHub-tests doorlopen, naar `main` mergen, in de bestaande Supabase-runtime aantoonbaar actief zijn en uit echte providergegevens gecontroleerd worden. Daarna volgen zeven dagelijkse controles zonder ontbrekende publicatiebewijzen of dubbele verzendingen. Tot die tijd blijft dit `herstel in uitvoering`, niet `alles groen`.

Geassocieerd incident: [GitHub #4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439).