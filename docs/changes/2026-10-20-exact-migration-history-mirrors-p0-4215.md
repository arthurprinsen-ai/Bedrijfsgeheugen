# Herstel exacte Supabase-migratiehistorie

Obligation-ID: database|exact-remote-migration-mirrors|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Dependent repair: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4540

Na beschermde merge van #4540 weigerde de Supabase Git-integratie met `Remote migration versions not found in local migrations directory`. Productie bevatte 20261020104501 en 20261020104518 zonder overeenkomstig bronbestand. Beide opgeslagen statement-arrays zijn onafhankelijk teruggelezen, de eerste via de provider migration API en de tweede via de migratiecatalogus. De SQL is bytegelijk aan de bestaande beschermde 20261020124500-migratie, SHA-256 `895c2c9e46d72c811bd6bed9639e73562fe8f4fabeba6eecc69e76bdc43f34df`.

Twee exacte bronspiegels herstellen de ontbrekende versie-identiteiten. Bestaande migraties en productiehistorie blijven behouden; geen SQL wordt leeg gemaakt, geen effect wordt fictief toegepast verklaard en er is geen directe productiedeploy. De oorspronkelijke dephase is idempotent en laat schedulers actief. De bestaande Git-integratie kan daarna de reeds beschermde reparaties toepassen. Dit verandert geen component of authority-relatie; de bestaande System Map blijft van toepassing. Brain learning wordt via de bestaande skill-projectie ontdekt.

De regressie faalde eerst voor beide ontbrekende bestanden en bewaakt nu exacte providerbytes én behoud van de oorspronkelijke bronidentiteit. Acceptatie: Required, CodeQL en preview; beschermde merge; productie-integratie zonder remote-only versies; exacte economics-functie/index/grants en migratiecatalogus teruglezen. #4215 blijft open voor de bredere database- en tweeklantacceptatie.
