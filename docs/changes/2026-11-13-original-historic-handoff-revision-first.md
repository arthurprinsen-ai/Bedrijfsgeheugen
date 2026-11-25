# 13 november 2026 — oorspronkelijke #171 historische source-revision krijgt voorrang

De bestaande broncorrectie via #5742 heeft precies 21 oorspronkelijke SKIPPED/no-send-bronrecords naar de expliciete onvolledige-besluitmeldingen gezet (20 blogs, één LinkedIn-bedrijfsrecord) en alle originele NONE provider-referenties ongemoeid gelaten. #5743 heeft productie-provider en Git applied-source lock naar dezelfde echte versie 847 gebracht. Tijdens onafhankelijke ketencontrole bleven **8/21** originele BRAIN-source-revisies achter ondanks geslaagde originele cron #171 en 21 OPEN BRAIN-no-publish-verplichtingen.

## Productie-root-cause (SELECT-only)

`public.powerhouse_content_handoff_receipts_v1` selecteert zijn oude historie met `ORDER BY coalesce(b.updated_at,'epoch'::timestamptz),c.publication_date,c.channel LIMIT 48`. Letterlijk dezelfde WHERE/ORDER BY in een read-only productiequery gaf 127 historische kandidaten; de 8 achtergebleven originele bronrevisies stonden op rang **52–114**, dus buiten iedere volgende batch zolang oudere onveranderde OPEN-bronnen de eerste 48 posities kunnen bezetten. De scheduler zelf is actief en geslaagd. Blind herhalen of een tweede uitvoerder zou het probleem niet oplossen.

## Permanente contractcorrectie, dezelfde originele functie

Originele source-revision en originele `consumer_ack.source_revision` worden bij de historische `ORDER BY` als eerste criterium gecontroleerd; elke mismatch krijgt prio 0, reeds bekende revisies prio 1. Daarna blijft de oorspronkelijke BRAIN-updated_at en datum/kanaalvolgorde intact en `LIMIT 48` ongewijzigd. Geen nieuwe tabel, scheduler, publicatie, bronvervalsing of terminale sluiting. De overige 44k oorspronkelijke SQL-functie, inclusief dezelfde ACL en bounded sociale leerloops, is byte-identiek met de oorspronkelijke bron van 13:20.

## Bewijs/acceptatie

Source regression `tests/brain-original-historic-handoff-revision-first-20261113.test.mjs` bewaakt exact één gewijzigde ORDER BY, een acht-mismatch negatieve/positieve replay en service-role only. Beschermde exact-head Required/CodeQL/native Supabase preview, merge, echte provider migratieversie+naam, BRAIN-database consumentenreadback op **21/21 exacte source_revision + consumer_ack.source_revision**. Geen no-send-cases terminaliseren zonder echt origineel veto/decision_code. Daarna alleen door de bestaande provider-lock-eigenaar de echt toegepaste geschiedenis vastleggen. Nadrukkelijk zijn de 366 andere content-OPEN, 185 sociale metingen, zeven rode lussen en omzet niet opgelost door deze reparatie.

Incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
