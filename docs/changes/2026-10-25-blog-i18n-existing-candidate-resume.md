# Bestaande blogrelease herstellen zonder de vertaalgate te omzeilen

De canonieke publicatie-PR #4848 voor 25 oktober heeft na inhoudelijke revisie een onvolledige vertaalcache. De exacte CI-log meldt 57 ontbrekende Engelse vertalingen, te beginnen met 'Circulaire economie'. De bestaande workflow stopte voortijdig zodra er al een JSON-patch voor de dag aanwezig was.

De reparatie houdt de huidige Supabase-first publicatiewriter, dezelfde dag-PR, provider en cachepatch aan. Bij een bestaande kandidaat loopt de reeds aanwezige full-build i18n-voorbereiding opnieuw. Die leest de bron na productietransformaties, hergebruikt alle bestaande vertalingen en voegt uitsluitend ontbrekende goedgekeurde vertalingen toe. Daarna blijft de volledige offline cachevalidatie verplicht. Onbereikbare provider of incomplete cache is nog steeds rood.

Bronbewijs: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40177039881/job/121119929113
Bestaande publicatie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4848

Status: beschermd herstelvoorstel, NIET live. Tests, beschermde merge, Netlify-provenance en exacte publieke readback moeten nog volgen.
