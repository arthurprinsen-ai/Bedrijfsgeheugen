# 2026-11-14: historische native migratiebewijzen 841/853 blijven geldig bij appends

Originele BRAIN: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43607605829  
Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232  
Eén bestaande eigenaar: `agent-data-quality`, `release-deployment-readback`, `supabase/migration-history.lock.json`, dezelfde beveiligde GitHub-release.

## Feitelijk bewezen oorzaak

De bestaande `migration-history.lock.json` bevat op 14 november **857** provider-geregistreerde migraties, met een actuele `captured_at` van `2026-11-14T14:16:51.001596Z`. De originele 841 blijft exact op index 840, ná de oorspronkelijke 840 onveranderlijke versies, met ongewijzigde versie, naam, voorganger en SQL. De historische outreach 852/853 staan op indexes 851 en 852, met de juiste versies `20261114080027` en `20261114083500`.

De postmerge BRAIN Delivery test produceerde 2 mislukkingen: (a) test 841 eiste foutief `captured_at` op **13 november**, ook nadat de officiële provider de bron op 14 november opnieuw had opgeslagen; (b) test 853 gaf de volledige live geschiedenis van 857 records aan een helper die expliciet alleen voor de **eenmalige protected historische 853-candidate** geldt. Die helper weigerde terecht een veralgemeniseerde 857-rijen release. De fouten zijn in de tests, niet in de feitelijke historische bron.

## Reparatie in dezelfde keten

- 841 blijft exact op oorspronkelijke index 840 met unieke oplopende versie en exact naam/voorganger; `captured_at` moet valide ISO en minimaal de oorspronkelijke dag zijn, niet op een voorbijgestreefde specifieke dag vallen
- 853 attesteert uitsluitend een **in-memory snapshot van de eerste 853** originele rijen, behoudt het echte beschermde `SOURCE_853_BASE`, SQL/MD5, exacte versie/namen en alle bestaande deny-tests
- Positieve regressie: latere provider-append doet geen afbreuk aan het oorspronkelijke 841/853-bewijs
- Negatieve regressie: gewijzigd historisch record, onjuist oud SHA, onbevoegde SQL, onjuiste MD5 of de volledige toekomstige versie als eenmalige exacte 853-candidate blijven falen
- Productie `supabase/migration-history.lock.json` en alle `supabase/migrations/*.sql` blijven 100% onaangeroerd; geen migratie-, scheduler-, provider-, autorisatie-, sociale publicatie- of e-mailsenderwijziging

## Acceptatie

Exact protected Required, CodeQL, full BRAIN Delivery en nieuwe historische regressies na merge. Onafhankelijke providerreadback blijft verplicht om actuele migratiebron en migratienaam/versie exact te vergelijken. Een groene historische CI-test bewijst **niet** dat Instagram, Gmail, blog, Heartbeat, portaal, omzet of het commerciële leerresultaat daadwerkelijk uitgevoerd is. Alle oorspronkelijke OPEN-verplichtingen blijven open totdat hun originele ontvanger en providerbewijs bewezen zijn.
