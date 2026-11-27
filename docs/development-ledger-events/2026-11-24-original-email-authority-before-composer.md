# Eén oorspronkelijke e-mailketen — 24 november 2026

**Obligation:** POWERHOUSE_20261124_EMAIL_PRODUCER_RECIPIENT_AUTHORITY_AND_AI_COMPOSER
**Owner:** ONE BRAIN → Powerhouse Growth & Revenue OS → Heartbeat. Alleen de bestaande producer, composer, sender en originele chronologie #112 / #113 / #114 / #129 / #132 / #133.

**Observed:** 23.295 CRM-connecties; 605 e-mailadressen; nul `email_marketing_permission` records. Drie e-mails vandaag voorbereid maar autoriteit/kwaliteit afgekeurd; zes acties 22–23 nov verlopen zonder provider-sendbewijs.

**Engineering:** originele bronproducer SQL vraagt voortaan expliciete, verifieerbare toestemming of bestaande-klantuitzondering vóór `prepared`; originele composer controleert exact dezelfde CRM-contactautoriteit vóór een AI-modelaanroep. Sender houdt bestaande, onafhankelijke gate. Gecontroleerde prompt voorkomt kunstmatig 'zonder vervolgafspraak'.

**Proof:** SQL/function + composer exact version in originele Supabase na protected merge; originele Gmail dry-run en echte providerreadback (indien ooit werkelijk toegestane kandidaten); ONE BRAIN/Heartbeat leert afzonderlijk van werkelijke resultaten. Geen toestemming wordt gegokt of bulkmail op een LinkedIn-export gemaakt.

**State:** PROTECTED_CI_PENDING, NOT YET DEPLOYED, NO NEW GMAIL_SEND.
Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

**Operationele CAS-uitvoering, 24 november:** drie ongeautoriseerde concepten met ongeldige copy zijn alleen bij status `prepared`, `executed_at=NULL`, afwezig providerclaim en matchende afkeuring op `expired` gezet. Audit/sender-truth behouden, `provider_verified_sent=0`. Daarna triggertegenstrijdigheid geconstateerd: `evidence.send_forbidden=false` ondanks `authority_quarantine`; die staat als geteste gerichte fix in hetzelfde reviewed SQL-bronbestand. Niet als live registreren vóór provider-DDL en onafhankelijke teruglezing.
