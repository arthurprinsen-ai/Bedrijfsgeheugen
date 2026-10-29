# Canonieke bronaanvoer LinkedIn persoonlijk naast Mira — 29 oktober 2026

## Bevestigd probleem

De bestaande cron `powerhouse-mira-problem-radar-v1` (job 120, actief, iedere avond, volgende zakelijke dag) selecteerde alle acht externe zoekopdrachten uit twaalf zakelijke ondernemerscategorieën. De persoonlijke LinkedIn-router `powerhouse_ensure_personal_source_rotation_v2(date)` accepteert daarentegen alleen negen herkenbare onderwerpen uit het dagelijkse leven, een aantoonbare bronpublicatiedatum in de laatste 45 dagen, een score van minimaal 0,72 en een ongebruikte bron-URL. Daardoor konden radar, Heartbeat en GitHub-slots correct slagen terwijl LinkedIn persoonlijk vijf keer terecht werd tegengehouden door een verhaalduplicaat van 24 oktober. Er was **geen nieuwe geschikte bron**. De reeds gemergede bron- en dedupefixes #5086/#5090 lossen een lege toevoer niet op. Instagram blijft afzonderlijk geblokkeerd wegens originele afgekeurde video-identiteit 0,900 < 0,940.

## Tweede ketenbreuk: de bron werd niet omgezet naar een persoonlijke aanbeveling

De reeds bestaande beveiligde bron-rotatie-RPC `powerhouse_ensure_personal_source_rotation_v2(date)` heeft géén andere aanroeper in de productiedatabase of de oorspronkelijke twee content-Edge-functies. Zelfs een geschikte bron uit de radar zou dus niet automatisch als persoonlijke contentaanbeveling verschijnen. De oorspronkelijke radar roept deze bestaande, idempotent bedoelde service-role-only RPC nu eenmaal aan direct na de bronopslag, binnen dezelfde `runDate`. De originele persoonlijke editor, duplicate-controle en publisher blijven alle beslissende poorten. De RPC retourneert `SOURCE_SUPPLY_REQUIRED` bij een lege toevoer en maakt geen provider-post.

## Herstel in dezelfde bestaande scheduler

De originele acht radarzoeken worden voortaan gesplitst in zes door de bestaande selector bepaalde ondernemersonderwerpen plus twee roterende alledaagse bronnen. De resultaten blijven in dezelfde Supabase-brontabel `powerhouse_mira_problem_signals_v1` en de reeds bestaande publicatieketen. Dit **voegt geen negende betaalde bronzoekopdracht**, geen scheduler, geen publisher en geen kunstmatig verhaal toe. De selectie volgt de bestaande nieuwsbron-dateringscontrole, minimale score, alleen HTTPS en eigen publicatiedatum van de provider. Een persoonlijk observatiesignaal heeft uitsluitend `personal-observational-life-source-v1` en `first_person_claims_present=false`; het wordt niet als persoonlijke ervaring van de oprichter gepresenteerd. De bevroren Mira-winnaar blijft uitgesloten doordat Mira's oorspronkelijke materializer uitsluitend het ondernemingscontract en de goedgekeurde PH-P-scene selecteert.

De bestaande, door identiteit en tenant beveiligde portaal-API `/api/powerhouse-observability` rapporteert nu het aantal daadwerkelijk vers, eligible en persoonlijk gecontracteerde bronsignalen, of `SOURCE_SUPPLY_REQUIRED` / `UNVERIFIED` wanneer ze ontbreken. De persoonlijke LinkedIn-providerstatus blijft afzonderlijk; een bronaantal bewijst geen post. De UI gebruikt de bestaande publicatiebewijskaart. Geen gegevens over externe bronnen of privé-inhoud worden publiek toegankelijk.

## Voorwaarden voor live en Brain

1. Protected PR op exact HEAD Required/CodeQL, productie-Netlify-SHA en browser/tenant-auth readback. Bevestig gewijzigde originele radar-Edge-functie in Supabase-productie met dezelfde cron-tokenbeveiliging; GitHub-merge alleen is hiervoor onvoldoende.
2. De eerstvolgende *natuurlijke* radarbronrun levert een echt vers gedateerde, geschikte bron; teruggelezen databasecontract, score, URL-nieuwheid en publicatiedatum. Als niets kwalificeert, toon geen vals groen maar verbeter de externe zoekvragen binnen het bestaande budget.
3. De originele persoonlijke editor, duplicate- en identiteitspoort maken een echt nieuwe, niet gefingeerde post en de originele publisher geeft een provider-ID en onafhankelijk leesbewijs. De geïsoleerde Instagram-mediaverifier eist nog steeds ≥0,940.
4. Brain-fingerprint `linkedin|personal|shared-radar-only-feeds-business-source-topics|20261029-v1` op OBSERVED totdat herhaling, productie-invoer, post en leereffect werkelijk bewezen zijn. Zevendaagse regressiecontrole vereist voor PROVEN.

Deze change is een **broncodekandidaat**, geen bewijs dat LinkedIn persoonlijk of Instagram vandaag gepubliceerd is. Zie [P0 issue #4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439).
