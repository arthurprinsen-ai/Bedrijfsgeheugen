# Powerhouse ondernemersbesturing — finance + human decisions (V2)

In de bestaande `portal-v2/` staan vijf ondernemersfuncties. Deze uitbreiding koppelt **Mijn bedrijf** aan de vooraf onafhankelijke geverifieerde `/api/portal-forecasts`, inclusief geauthenticeerde tenantscope, bronherkomst, validatiedatum en een onderscheid tussen historische reeks en geverifieerde voorspelling. Voor ontbrekende brondata blijven KPI's leeg.

**Mijn acties** toont de beslissingen uit `/api/brain-operating-loop`. Met een expliciete klik kan de ondernemer een besluit goedkeuren/afwijzen via `/api/company-decision`, met statusverwachting, idempotency key en nieuwe serverreadback. Geen providertransactie volgt uit deze interface; de bestaande beleidspoorten blijven actief.

Bestaande bron- en governance-controles zijn niet verlaagd. Voordat finance, klantbereik, doorlopende automations en bedrijfswaarde voor echte klanten kunnen worden geclaimd, zijn betrouwbare ERP/CRM-gegevens, bevoegdheden, verifieerbare provider-sends en gerealiseerde waarden nodig.

GitHub issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4407
