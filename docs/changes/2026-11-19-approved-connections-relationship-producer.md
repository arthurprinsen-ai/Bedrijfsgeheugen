# 2026-11-19 — Goedgekeurde connecties krijgen een producer

Probleem: 119 goedgekeurde ontvangers (human_approved, geldig e-mailadres, functie en bedrijf, niet onderdrukt) worden nooit klaargezet, omdat de enige producer ook een predictieve brief eist.

Fix: `powerhouse_prepare_connection_relationship_email_v1`, aangeroepen vanuit de bestaande dagelijkse job. Per dag maximaal 3 extra acties (totaal met het predictieve pad maximaal 5), status `prepared`, met `relationship_evidence` (functie, bedrijf). Composer-kwaliteit, suppressie, cooldown van 30 dagen en provider-readback blijven bepalend. Geen nieuwe scheduler, geen verzending, geen nieuwe goedkeuringen: alleen ontvangers die Arthur op 27 okt 2026 al goedkeurde.

Bewezen: brontests en een selectie op echte data (119 geschikt, 73 nooit aangeboden). Niet bewezen: migratie toegepast, actie klaargezet, bericht gegenereerd, verzending, reactie. Fingerprint `powerhouse|commercial|approved-connections-without-predictive-brief-never-prepared|20261119-v1`.
