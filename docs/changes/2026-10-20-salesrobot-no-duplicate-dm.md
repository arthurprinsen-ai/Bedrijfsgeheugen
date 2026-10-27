# 20 oktober 2026 — veilige SalesRobot-DM-uitvoering
Obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Root cause
De bestaande Powerhouse LinkedIn-salesmachine zet een geclaimde `waiting`-actie na een exception in de SalesRobot-send/ack-route terug op `suggested`. Bij een timeout of mislukte databasebevestiging kan de provider het bericht al hebben afgeleverd; de nieuwe poging kan dezelfde ontvanger dubbel berichten.

## Eén bron en één uitvoerder
Wijzigt uitsluitend de bestaande salesmachine en regression; geen tweede LinkedIn-verzender, scheduler, CRM of verzendqueue. De originele actie blijft `waiting`, markeert `needs_readback=true` en `republish_forbidden=true`. Externe readback moet eerst het resultaat van deze bestaande actie vaststellen. Een ontbrekende ontvangstbevestiging is niet succesvol of retrybaar. Human approval, identiteitscontrole, suppressions, cooldown en de bestaande kwaliteitscontrole blijven onveranderd.

## Providerbeperking
Op 20 oktober meldt SalesRobot een verlopen trial/betaling, geen uitvoeringsdagen, een gepauzeerde campagne en een verlopen LinkedIn-cookie. Code kan die externe facturatie/OAuth niet rechtmatig corrigeren. Markeer de externe route onbeschikbaar tot echte providerherautorisatie en uitvoerbaarheid.

## Acceptatie
Deze source candidate is NIET live. Vereist exacte-head CI, CodeQL, beschermde merge, Supabase Edge-production readback én een echt geautoriseerd en onafhankelijk gecontroleerd provider-resultaat. Dagelijkse commerciële FULL_GREEN blijft verboden zolang outreach of outcome-proof ontbreekt.
