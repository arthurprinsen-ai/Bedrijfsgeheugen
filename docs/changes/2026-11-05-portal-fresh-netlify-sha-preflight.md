# Portal V2 — actuele productieversie controleren vóór iedere acceptatie

5 november 2026 · Oorspronkelijke eigenaar: Portal V2 UX/Engineering  
**Status:** broncorrectie op PR #5432, beveiligde testen en productieacceptatie nog niet bewezen.

## Wat ging verkeerd?
De bestaande Portal-agent controleerde bij een productietest niet expliciet eerst welke Netlify-versie werkelijk gepubliceerd was. Ook startte de bestaande productie-browserworkflow niet automatisch wanneer alleen de Portal-skill werd gewijzigd. Een oude succesvolle browserrun kan daardoor onterecht worden gelezen als bewijs dat een nieuwe preventieregel werkt.

## Oplossing binnen het bestaande systeem
De oorspronkelijke Portal-skill verplicht voortaan vóór **elke** controle een nieuwe provider-readback: READY Netlify deployment, niet-gecachete `https://www.bedrijfsgeheugen.nl/release.json`, het onveranderlijke `/release.json` van exact dezelfde deploy, geldige commitidentiteit en beschermde GitHub-herkomst. Alleen de bestaande `.github/workflows/portal-v2-production-dom-readback.yml` wordt aangeroepen, nu met een exacte trigger voor de skill; de bestaande bron-/securitycontroles blijven actief. Na de echte Chromium DOM-, mobiele en visuele controles worden GitHub-resultaat en productie-identiteit opnieuw onafhankelijk gecontroleerd en in ONE BRAIN geregistreerd.

## Eerste CI-fout en structurele preventie
De eerste beschermde Required-uitvoering op PR #5432 (run `41992467024`, job `127127685482`) faalde op een **verplichte onvolledige integratiebundel**, niet op een bewezen Portal-runtimefout: `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning,human_documentation`. De ontbrekende ONE BRAIN-regel, het ledger en dit document worden in dezelfde PR toegevoegd. Geen testskip, securitywaiver, tweede scheduler of bron-drift-uitzondering.

De nieuwe regressietest `tests/brain-portal-current-netlify-sha-preflight-20261105.test.mjs` houdt de exacte workflowtrigger en oorspronkelijke productie-integriteitseisen vast.

## Wat mag pas groen worden na echt bewijs?
- Protected Required, CodeQL en volledige BRAIN slagen op de actuele PR-HEAD; PR wordt volgens branch protection gemerged.
- De **werkelijk nieuwe** commit staat READY op Netlify en dezelfde SHA staat in canonieke én immutable release.json.
- De originele browser-, mobile- en visual-readback slagen met de nieuwe productie-SHA; postcheck bevestigt onveranderde identiteiten; de oorspronkelijke agent registreert oorzaak, regressie, uitkomst en preventie in ONE BRAIN.
- Ondernemerstesten zonder begeleiding, twee geauthenticeerde tenants, echte VoiceOver/TalkBack en onafhankelijke WCAG 2.2 AA blijven afzonderlijk OPEN tot feitelijk gemeten.

## Bronnen
- Canonieke herstelissue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
- Dezelfde herstel-PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5432
- Leerregistratie: `brain/learning/2026-11-05-portal-fresh-netlify-sha-preflight-v1.json`
- Ledger: `docs/development-ledger-events/2026-11-05-portal-fresh-netlify-sha-preflight.md`

Dit document registreert geïmplementeerde broncorrecties, geen verzonnen livegang.
