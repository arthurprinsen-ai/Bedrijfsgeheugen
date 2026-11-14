# 14 november 2026 — Publieke zakelijke bronpagina's werkelijk vinden

## Geobserveerd in productie

De oorspronkelijke research Edge v28 en SQL 20261114211500 zijn onafhankelijk live bewezen, maar de eerste 8 originele first-party onderzoeksacties op bestaande bedrijfsdomeinen (Barnes, BMN, Bradesco, Brentano, Capgemini, Cerios, Company.info) leverden 0 succesvol opgehaalde HTML-bronpagina's en 0 nieuwe zakelijke e-mailadreskandidaten op. Bestaande basis: 23.295 contacten, 605 adressen. Een HTTP-loop / cron success was dus geen echte geslaagde adresverrijking.

## Oorzaak

Vaste `/team`- en `/contact`-padgokken geven bij veel bedrijven 404 of redirects (bijvoorbeeld een trailing slash, andere taal of www-host). De bronfunctie hield alle redirects tegen. Daardoor bleef de bronselectie zonder daadwerkelijk HTML-bewijs. Het beperkte aantal bronpogingen wordt niet verhoogd en er wordt geen extra betaalde SERP-query geïntroduceerd.

## Herstel binnen dezelfde keten

De oorspronkelijke Edge haalt eerst maximaal 160 kB openbare HTTPS-homepage HTML op met één gezamenlijke 3,5s-fetchdeadline en hooguit twee handmatig goedgekeurde same-company apex/www-redirects. Hij kiest maximaal één werkelijk op deze homepage gepubliceerde, relevante same-host team/about/contact link uit; de homepage plus deze link vormen maximaal twee onderzochte pagina's. Als de homepage niet bereikbaar is, volgt een strikt begrensde alternate-www/contact fallback. De originele `powerhouse_sales_actions`-actie, bron-ID, status, retry-after en no-source feedback blijven de enige registratie; de originele `powerhouse_runtime_events` en #138 / ONE BRAIN consumer blijven het enige ontvangstpad. De natuurlijke dagidentiteit gebruikt Europe/Amsterdam.

Gevonden e-mails worden alleen bij expliciete naam + bedrijf + domein + `mailto:` als niet-verzendbare kandidaat geparkeerd. Geen automatische `bg_connecties.email`-promotie, nieuwe scheduler, andere CRM, mailverzending of betaalde enrichment-vendor.

## Acceptatie

Node-regressie voor same-origin redirects, offsite/privéadres-afwijzing, daadwerkelijk gepubliceerde paginalinks en no-send. Daarna beschermde exacte Required/CodeQL, originele Edge-main-deploy, letterlijk bronbestands-readback, echte natuurlijke bronpagina's >0, kandidaat-/NO_SOURCE-registratie met originele actie-ID, onafhankelijke #138 PROCESSED-ACK alleen bij echte kandidaat. Zonder kandidaat geen claim van e-mailgroei of volledige een-lus-uitkomst.
