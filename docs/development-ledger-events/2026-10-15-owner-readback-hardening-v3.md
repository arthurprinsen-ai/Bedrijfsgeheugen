# Powerhouse owner readback hardening
Datum: 2026-10-15
Obligation-ID: powerhouse-owner-readback-hardening-20261015-v3
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4414
Baseline: beschermde PR #4411, commit 3d6303b9e8fd4c139fad8969ec5d77aa251f3593

## Defecten
Een geauthenticeerde financiële route stuurde bij lege resultaten nog geen servertenant terug en gaf de oorspronkelijke request niet mee aan Netlify Identity. Bij een onduidelijke response op een besluit kon hetzelfde besluit opnieuw met een andere idempotentiesleutel worden aangeboden. De compacte overzichtingang bleef bij hydratatie soms naar verouderde lokale state verwijzen.

## Correctie
Alle financiële resultaten, inclusief ontbrekende waarnemingen, krijgen servertenantId. De client mag bij onbekende tenant nooit een getal aan een ander bedrijf toeschrijven. De besluitinterface weigert ontbrekend tenantbewijs en hergebruikt dezelfde idempotentiesleutel voor dezelfde expliciete APPROVE/REJECT-statusovergang. Compacte handlers worden bij overzichtverversing opnieuw gekoppeld aan de actuele state. Geen externe providertransactie toegevoegd.

## Controle / status
Regressie in `tests/portal-owner-tenant-readback-v3.test.mjs`; overige bestaande Portal V2 en Brain-contracten blijven verplicht. Geschreven code is geen live klantbewijs: Required CI, CodeQL, protected merge en onafhankelijke Netlify/authenticated release-readback volgen afzonderlijk.
