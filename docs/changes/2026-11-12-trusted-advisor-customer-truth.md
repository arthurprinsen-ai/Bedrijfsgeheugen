# Trusted Advisor: zichtbaar vertrouwen door klantwaarheid (12 november 2026)

## Doel en bron
De bestaande originele norm `brain/policies/trusted-advisor-assurance-v1.json` was al van kracht. Deze wijziging werkt binnen dezelfde eigenaar en publicatieketen, zonder nieuwe executor of parallelle opslag. Extern kwaliteitskader: [Trusted Advisor Trust Equation](https://trustedadvisor.com/articles/the-trust-equation-a-primer) en [Stanford Web Credibility Guidelines](https://credibility.stanford.edu/guidelines/).

## Reproduceerbare observaties in de originele hoofdbronnen
1. De primaire pagina's claimden in hun navigatie zeven vragen voor de gratis zelfscan terwijl `zelfscan.html` twaalf vragen en drie minuten belooft.
2. De navigatie zette de Frisse Blik neer als een traject van dertig minuten terwijl de aanbodpagina een bredere betaalde beoordeling beschrijft.
3. De bovenbalk en gedeelde mobiele navigatie claimden in algemene zin een start binnen twee weken, zonder het product, voorwaarden of bewijs te specificeren.
4. `contact.html` stelde dat een automatisch e-mailrapport volgt, terwijl de gratis scan volgens de eigen route geen verplicht e-mailadres vraagt en direct resultaat biedt.
5. De ongebruikte eindsectie van `zelfscan.html` bevatte nog een oud e-mailrapport-binnen-één-werkdag-beloftesjabloon.
6. Het Portal V2 betrouwbaarheidsmodel telde bronnen zonder `healthy` expliciet `false` als gezond en gaf een outcomes-pagina de status `verified` wanneer één outcome `status=ok` of `healthy=true` had. Transport- of verwerkingssucces was daarmee ten onrechte gelijk aan onafhankelijke uitkomstverificatie.

## Gerepareerd in dezelfde bronbestanden
- Primair websitepad `index.html`, `contact.html`, `zelfscan.html`, `frisse-blik.html`: consistente 12-vragen-navigatie, neutraler aanbod, geen ongeconditioneerde vaste levertijd.
- `assets/js/menu.js`: gedeelde mobiele navigatie biedt een realistische verwachting in plaats van een algemene levertijdgarantie.
- Contact en gratis zelfscan: resultaat op het scherm, geen automatische e-mailbelofte; betaalde Frisse Blik blijft afzonderlijk.
- `portal-v2/trusted-advisor-assurance.js`: onbekende brongezondheid is niet groen; een generieke `ok` bewijst niets; de status `verified` vergt voor alle weergegeven outcomes expliciete verificatie plus een bewijsreferentie. De strip noemt zich nu `Bronnen en zekerheid`, met `Bekijk onderbouwing`.
- Oorspronkelijk beleid en bestaande CMS-redactieskill aangescherpt; geen nieuwe scores, noem jezelf niet geaccrediteerd of onafhankelijk gecertificeerd.
- Regressies: `tests/brain-trusted-advisor-assurance-v1.test.mjs` en `tests/brain-trusted-advisor-customer-journey-20261112.test.mjs`.

## Afbakening / onbewezen gebleven
- Vier primaire publieke pagina's zijn nu brontekstueel gelijkgetrokken. Dezelfde oude sjabloonfragmenten kunnen elders in de website voorkomen; dit is geen volledige sitewide-crawl of bewijs dat alle pagina's semantisch identiek zijn.
- Er is geen meting van werkelijk hoger klantvertrouwen, leadconversie, SEO-groei of klanttevredenheid. Dat blijft UNKNOWN.
- De authentieke ingelogde tenant-user journey, bronbeschikbaarheid, portal save/reopen, live mobile-browserinteracties en onafhankelijke outcome-ACK zijn niet afgeleid uit statische tests.
- Portal V2 presenteert expliciete bewijsreferenties als verifier-signalen; daadwerkelijke provider-readback en authenticiteit van die referenties moeten ook server-side worden afgedwongen.
- Niet zelfstandig claims van werkende koppelingen, controleerbare klantcases, veiligheidskeurmerken, certificering, gemiddelde doorlooptijd of ROI toevoegen.

## Release-/leercontract
Fingerprint: `powerhouse|trust|unsupported-claims-and-outcome-status|20261112-v1`.
Owner: originele website/CMS/Portal V2/ONE BRAIN-keten.
Preflight: code- en kwaliteitsregressies, protected Required/BRAIN/CodeQL; beveiligde merge naar `main`; onafhankelijk Netlify readback van exacte SHA; functionele browserchecks op desktop/mobiel; herleidbare correctie- en CTA-events met toestemming.
Geen groen of LIVE claim vóór die controles. Nieuwe herhalingen van deze foutklasse koppelen aan dezelfde fingerprint, oorzaak, hersteltest en evidence-id in de originele incidentregistratie.
