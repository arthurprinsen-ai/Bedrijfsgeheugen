# Pricing interaction section build preservation — 24 september 2026

## Root cause
De productiebron bevatte de lifecycle-, pakket- en billing-selectors correct, maar de Netlify browsergate kon `[data-bg-stage="loss"]` niet vinden. De build-integriteitslaag herstelde na de V18-transformaties alleen `section#pakketten`. De interactieve route- en abonnementscontrols staan echter in de voorafgaande `section#prijzen-pakketten`.

## Fix
De canonical restore behandelt `#prijzen-pakketten` en `#pakketten` voortaan als één atomair pricingcontract. Beide secties worden teruggezet uit de pre-build snapshot. De integriteitscheck faalt nu ook expliciet wanneer lifecycle-, stage-panel-, plan-tab- of billing-selectors ontbreken.

## Bewijscontract
Bronmarkers alleen zijn onvoldoende. `tools/site-shell/verify-pricing-i18n-production.mjs` blijft de terminale gate en moet in productie werkelijk klikken op lifecycle, plan-tab en jaarbilling en vervolgens de statische Engelse route bewijzen.
