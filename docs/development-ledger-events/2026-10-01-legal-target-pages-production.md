# Legal target pages production closure — 1 oktober 2026

Obligation: `legal-target-pages-production-20261001`

Productiecommit `664231ce0566d7a0d6ec3d02d6d97a0b71704976` bracht de vier juridische/statuslinks in de footer, maar `gebruiksvoorwaarden.html`, `cookiebeleid.html` en `systeemstatus.html` stonden nog niet op dezelfde actuele main-lineage.

Herstel: PR #3581 levert de drie ontbrekende doelpagina's, de volledige Engelse vertaalcache en expliciete website-lane classificatie. De release is pas terminal wanneer Required test, pagina/SEO-controle, merge naar main en productie-readback van alle drie routes aantoonbaar groen zijn.
