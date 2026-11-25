# Contactdruk meet alleen daadwerkelijk uitgaand contact

**Probleem:** POWERHOUSE telde intern marktonderzoek met `executed_at` mee als klantbenadering. Daardoor leken ondernemers meer berichten te hebben ontvangen dan werkelijk het geval was. Op 9 oktober werd bij één bestaande connectie drie uitgaande acties gezien, terwijl Gmail twee echte e-mails in dezelfde thread bevestigde.

**Reparatie:** De bestaande databaseview `powerhouse_contact_pressure_v1` telt uitsluitend werkelijk uitgevoerde acties (`status='done'`, `executed_at`) op expliciete ontvangergerichte kanalen e-mail en LinkedIn-DM. Zowel `email`/`E-mail` als `linkedin_dm`/`LinkedIn DM` worden genormaliseerd. Interne research, publieke reacties, voorbereide of overgeslagen acties blijven buiten de outbound-teller. De bestaande contactdruk-, wachttijd- en anti-spamformules zijn ongewijzigd en blijven op echte contactmomenten reageren.

**Veiligheid en bewijs:** Geen nieuw Brein, scheduler, CRM, SalesRobot-campagne of verzending. De bestaande view houdt `security_invoker=true` en alle uitvoerkolommen. De wijziging gaat via een beschermde GitHub PR met native Supabase Preview, regressietest en daadwerkelijke productie-readback. Deze codewijziging creëert geen verzendbewijs en markeert geen omzet als gerealiseerd.
