# Trusted Advisor — herstel verouderde productie-oracle (12 november 2026)

**Bestaande eigenaar:** originele website/site-shell-verificatie binnen ONE BRAIN en beschermd GitHub/Netlify-releasepad. Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5284

## Echt reproduceerbare fout
Na de beschermde merge van header-PR #5693 (main `839086756f2559b9abeb8decc8d945e2f0a3d919`) toont de publieke website onafhankelijk aantoonbaar 'Duidelijke afspraken vooraf' en 'Klein beginnen, resultaat toetsen'. De oorspronkelijke `.github/workflows/canonical-brand-shell-live-readback.yml` run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43320591686 mislukte desondanks omdat `tools/site-shell/live-contract.mjs` nog exact de **oude** twee beloften eiste. De workflow probeerde dit zestien keer; het is een deterministische test-oracledrift, geen reden om productie terug te draaien.

De melding `growth endpoint status=405` is geen tweede defect: de oorspronkelijke workflow eist juist HTTP 405 voor de niet-toegestane GET op `/api/growth-event`.

## Bestaande contractcorrectie
- Vervang uitsluitend de twee oude TRUST-verwachtingen in de oorspronkelijke `tools/site-shell/live-contract.mjs`.
- Harmoniseer dezelfde twee teksten in `tools/site-shell/test-live-contract.mjs`.
- Voeg een gerichte ONE BRAIN-regressie toe die de productieverifier, fixture, originele generator en sitewide guard op de huidige bronwaarheid vergelijkt en de oorspronkelijke live-contractfixture werkelijk draait.
- Originele README/skill, leerrecord en ledger registreren fout, oorzaak, preventie, bewijs en eigenaar. Geen tweede verificateur, ander endpoint, langere timeout, verminderde assertions, publicatie of deploy-omweg.

## Wat bewust ongewijzigd blijft
Productie SHA marker, shell-hashpariteit, menu, controle op betaalplannen en prijzen, pakketadvies-CTA, originele SEO-order engine, groei-endpoint GET 405-contract, volledige browser/viewportcontrole, security en tenant-scheiding.

## Terminal bewijs
Candidate CI, BRAIN replay, CodeQL en toepasselijke bestaande website/generator-tests, beschermde merge, exact nieuwe Netlify-commit en succesvolle **oorspronkelijke postmerge brand-shell readback** zijn vereist. Tot dan `CODE_CANDIDATE`; negen publiek gecontroleerde correcte headers bewijzen wel de vorige websitecorrectie maar niet dat deze oracle-fix al live is. Er wordt geen klantvertrouwen, conversie of volledig tenant-ACK uit verzonnen.
