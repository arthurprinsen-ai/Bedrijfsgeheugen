# Ontwikkelgebeurtenis: mobiele header Bedrijfsgeheugen
Datum: 2026-10-15
Obligation-ID: BG-MOBILE-HEADER-20261015
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4392

## Aanleiding
Gebruiker leverde twee iPhone-screenshots aan: homepage en /product. Zichtbaar: visuele dubbele menuaanduiding, hoge trustbar, oversized overlappende gele titelmarkeringen en een vaste €-zoektijdkaart over de inhoud.

## Wijziging
Canonical brand-shell in tools/site-shell/components.mjs aangepast voor telefoonbreedte; pagina-afhankelijke screenshot-problemen bij de bron (V18 delivery) aangepakt, niet op legacy index.html. Popupcleanup toegevoegd onder assets en gekoppeld in de laatste buildfase. Regressioncontract tests/site-shell-mobile-header.test.mjs.

## Controle
Bronbestanden op GitHub teruggelezen; initiële CI blokkeerde op ontbrekende PR-metadata en daarna onjuist geclassificeerde test; beide hersteld. Beschermde CI en productieacceptatie waren op het moment van deze registratie nog niet bevestigd. Geen handmatige merge of bypass uitgevoerd.
