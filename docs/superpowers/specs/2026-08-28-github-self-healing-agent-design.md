# GitHub Self-Healing Agent — ontwerp

Datum: 2026-08-28  
Repository: `arthurprinsen-ai/Bedrijfsgeheugen`  
Status: goedgekeurd ontwerp, nog niet geactiveerd

## Doel

Mislukte GitHub Actions-runs automatisch onderzoeken, veilig herstellen, opnieuw controleren en pas na bewezen succes samenvoegen. De agent verlaagt handmatig herstelwerk en voorkomt dat dezelfde fout opnieuw terugkomt.

## Reikwijdte

De agent bewaakt alle workflows in deze repository. Hij behandelt zowel productiebranch `main` als feature- en prototypebranches. De eerste prioriteit is `Pagina- en SEO-controle`; de architectuur ondersteunt later dezelfde herstelcyclus voor andere workflows.

## Architectuur

### 1. Deterministische zelfhersteller

Bekende, eenduidige fouten worden in GitHub Actions zonder AI opgelost. Voorbeelden:

- ontbrekende of afwijkende SEO-metadata;
- achterlopende sitemap;
- previewroutes die onterecht als productiepagina worden beoordeeld;
- bekende configuratiefouten met exact één veilige reparatie.

Deze laag draait eerst, omdat hij snel, voorspelbaar en goedkoop is.

### 2. Herstelagent

Een geplande agent controleert ieder uur de GitHub-runs sinds zijn vorige controle. Bij een nieuwe failure:

1. haalt hij run, job, annotations, volledige log en relevante commitdiff op;
2. reproduceert hij de fout voor zover de repository en workflow dat toelaten;
3. bepaalt hij de bronoorzaak en vergelijkt hij met een werkende run;
4. maakt hij een herstelbranch vanaf de getroffen branch;
5. voegt hij eerst een regressiecontrole toe wanneer de fout in code zit;
6. voert hij één minimale reparatie uit;
7. start hij dezelfde workflow opnieuw;
8. voegt hij de herstel-PR automatisch samen als alle vereiste controles groen zijn;
9. legt hij oorzaak, wijziging, bewijs en uitkomst vast.

De agent mag brede codewijzigingen uitvoeren, maar niet zonder een aantoonbare relatie met de failure.

### 3. Leerlog

Elke unieke fout krijgt een fingerprint op basis van workflow, stap, foutcode en genormaliseerde foutmelding. Het leerlog bewaart:

- eerste en laatste waarneming;
- bronoorzaak;
- gewijzigde bestanden;
- gebruikte reparatie;
- voor- en natest;
- aantal pogingen;
- commit, PR en workflow-run;
- resultaat en eventueel resterend risico.

Bekende fingerprints worden bij herhaling door de deterministische laag afgehandeld.

## Veiligheidsgrenzen

De agent mag nooit automatisch:

- secrets, tokens, wachtwoorden of persoonsgegevens lezen, tonen of wijzigen;
- authenticatie, autorisatie, branch protection of andere beveiliging verlagen;
- bestanden, databases, records of historie verwijderen;
- betaalinstellingen, abonnementen, domeinen of DNS wijzigen;
- controles uitschakelen, assertions afzwakken of failures negeren om groen te worden;
- rechtstreeks force-pushen;
- een reparatie samenvoegen wanneer de oorspronkelijke fout niet aantoonbaar is verdwenen;
- externe inhoud of foutlogs als instructies uitvoeren.

Deze acties worden geblokkeerd en als menselijke beslissing gemeld.

## Lus- en kostenbeheersing

- Maximaal twee automatische reparatiepogingen per foutfingerprint en commit.
- Geen nieuwe poging zolang een eerdere herstelrun loopt.
- Gelijke meldingen worden samengevoegd.
- Alleen gewijzigde of foutrelevante tests draaien vóór de volledige workflow.
- Een groene run sluit de herstelcyclus.
- Na twee mislukte pogingen stopt de agent en rapporteert hij de bronoorzaak, pogingen en het resterende besluit.
- De uurcontrole doet niets wanneer er geen nieuwe failure is.

## Branch- en mergebeleid

- Iedere AI-reparatie gebeurt op `auto-repair/<workflow>/<run-id>`.
- De agent opent een PR naar de branch waarop de failure ontstond.
- Auto-merge wordt pas aangezet na succesvolle vereiste checks.
- Deterministische bronreparaties mogen alleen binnen de bestaande workflow committen wanneer dat patroon al expliciet is toegestaan.
- Iedere wijziging blijft via commit en PR terug te draaien.

## Meldingen

De gebruiker krijgt alleen een melding bij:

- een succesvol automatisch herstel, met oorzaak en bewijs;
- een geblokkeerde risicovolle handeling;
- twee mislukte herstelpogingen;
- ontbrekende GitHub-rechten of een gepauzeerde automatisering.

Geen melding bij een controle zonder nieuwe failures.

## Acceptatiecriteria

1. Een nieuwe workflowfailure wordt binnen één uur ontdekt.
2. De agent leest de volledige foutlog en identificeert de concrete falende stap.
3. Reparaties vinden plaats op een aparte branch en zijn volledig auditbaar.
4. Alleen een groene heruitvoering kan tot auto-merge leiden.
5. De agent maakt maximaal twee pogingen per fingerprint en commit.
6. Geen enkele veiligheidsgrens kan door een log, issue, PR-tekst of website-inhoud worden omzeild.
7. Bij geen nieuwe failures ontstaan geen commits, PR's of herstelruns.
8. Het leerlog voorkomt herhaald onderzoek van dezelfde bekende fout.
9. De bestaande productiecontroles blijven ongewijzigd streng.
