# Dagelijkse verrijking 23.295 connecties: wat wél en niet bewezen is

Datum: 14 november 2026. Parent #4198. PR #5785.

## Voor klanten en beheer
Powerhouse bewaart 23.295 unieke connecties in het bestaande `public.bg_connecties`. Voor alle 23.295 is vandaag een gedateerde contextbeoordeling aanwezig. Die beoordeling projecteert reeds ingelezen LinkedIn- en zakelijke signalen; het is géén bewijs van 23.295 actuele providerprofielopvragingen of een dagelijkse externe e-mailzoekactie.

Van deze contacten hebben 605 een opgeslagen syntactisch geldig e-mailadres (2,6%). De andere 22.690 hebben geen adres in de canonieke contactbron. Er zijn nul telefoonnummers opgeslagen. Telefoon, privé-adressen en andere persoonlijke gegevens mogen niet worden geraden of onnodig verzameld.

## Waarom groen niet automatisch goed betekende
De oorspronkelijke dagelijkse full/batch refresh schreef `source_snapshot` opnieuw en behield uitsluitend de dagelijkse beslissingsmetadata. Een aparte `email_authority`-status van de originele contactbeoordeling kon daardoor verdwijnen. Een geslaagde cron of 100% contextdekking bewees dus niet dat contacttoestemming, consumer handoff, nieuwe brondata of Gmail-ontvangst correct was.

## Wat de beschermde kandidaat corrigeert
Migratie `20261114164500_preserve_contact_authority_on_connection_refresh_v1.sql` behoudt in beide originele refreshfuncties exact de vorige `email_authority` wanneer die aanwezig is, zonder die status te verversen of contactautorisatie te genereren. Een eerdere beoordelingsdatum blijft een eerdere beoordelingsdatum. De test onder `tests/brain-contact-authority-refresh-preservation-20261114.test.mjs` moet slagen en de originele beschermde release heeft voorrang op handmatige mutaties.

De bestaande agent/skill en bestaande Growth & Revenue OS beoordelen dagelijks apart:
1. Dekkingsgraad van het dagprofiel (context).
2. Nieuwe e-mails die echt van rechtmatig beschikbare bronnen, met identiteitsmatch, bron, revisie en tijdstempel zijn ingelezen.
3. E-mailtoestemming/suppression en de beoordelingsdatum.
4. Oorspronkelijke handoff naar de genoemde ONE BRAIN-consumer met `PROCESSED` receipt, gevolgd door Heartbeat/NBA verwerking en aantoonbare uitkomst.

Geen van deze vier bewijzen vervangt de andere. Geen toestemming afleiden van een LinkedIn-connectie. Geen LinkedIn scraping, gegokte adressen, illegale bulk harvesting, tweede CRM, tweede scheduler of automatisch versturen bij nieuw adres.

## Acceptatie
PR #5785 is een kandidaat, geen live-release. Vereist zijn actuele originele CI/CodeQL/Supabase Preview (waar toepasselijk), beschermd merge, exacte SQL-source-readback, echte natuurlijke cron #138/#116 runs, behoud van email_authority, echte adresdekking-delta, ONE BRAIN `PROCESSED` en Heartbeat-consumentbewijs. Indien e-mailadressen niet groeien door echte geautoriseerde brondata blijft de acquisitie OPEN. Blijvende foutcases horen uitsluitend bij bestaande P0 #4198.
