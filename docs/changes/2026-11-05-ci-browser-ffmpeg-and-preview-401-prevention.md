# Incidentpreventie — Playwright-installatie HTTP 504 en Netlify-preview HTTP 401

Datum: 2026-11-05. Eigenaar: bestaande website-cross-browser- en Portal V2 Live Preview-eigenaren.
Bronincidenten: [Netlify-release #4447](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447); [Portal V2 #4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547).

## Feiten en oorzaken

**GitHub run 42047646698, job 127314880548.** In de bestaande `website-cross-browser-screenshot-assurance.yml` faalde `npm install --no-save playwright@1.55.0`. De root-package bevat `ffmpeg-static@5.3.0`; diens postinstall vroeg via de externe GitHub-release een README/binary aan en kreeg HTTP 504. De Playwright-browsercontroletest (20+ contractchecks) was vooraf groen, maar geen Playwright-engine werd uitgevoerd en het daarna ontbrekende screenshot-artifact veroorzaakte een tweede CI-fout. Geen browsergroen.

**GitHub run 42048047434, job 127316300431.** In de bestaande `portal-v2-live-preview.yml` gaf de Netlify-release-URL herhaald HTTP 401. Netlify-projecttoegang verplicht SSO voor nonproduction. De oude `curl -fsS ... || true` verdoezelde de status en wachtte 48 × 10 seconden voordat een generieke timeout verscheen. Ongeautoriseerde preview is geen defect in de GitHub-broncommit en geen reden om autorisatie te omzeilen.

## Structurele herstelregels (originele workflow)

1. **Browser prerequisite:** installeer Playwright via `npm install --no-save --ignore-scripts playwright@1.55.0`, omdat het screenshot-script geen `ffmpeg-static` executable gebruikt. Installeer de drie echte browser-engines en OS-dependencies nog wel expliciet via `npx playwright install --with-deps chromium firefox webkit`. Test- en CLS-drempels blijven ongewijzigd. Produceer bij installatiefout `ci-install-error.json` binnen de bestaande artifactmap; geef nooit een screenshots-PASS zonder echte browser.
2. **Immutable preview auth:** vang HTTP-status van zowel de PR-alias als de immutable Netlify-deploy op. Bij 401/403 onmiddellijk de vaste foutklasse `NETLIFY_PREVIEW_AUTH_REQUIRED` plus eigenaar/providerstatus in `GITHUB_STEP_SUMMARY`; geen response bodies, cookies, tokens of geheime URLs loggen. Herstel eventuele SSO-toestemming uitsluitend via de bestaande geautoriseerde Netlify/team-eigenaar. Pas na HTTP 200 én exacte SHA + immutable deploy ID kunnen de bestaande Portal V2-browserchecks slagen. Andere tijdelijke statuses mogen binnen de bestaande begrensde wachtrij herstellen.
3. **Kwaliteitspoorten:** nieuwe machine-readable regressietests `tests/brain-ci-browser-install-and-netlify-preview-auth-20261105.test.mjs`, originele Required, CodeQL, BRAIN, bestaande artifact-/preview- en productietests. Geen wijzigingen aan GitHub-beveiliging, provider-permissies, productie-writer, OIDC of bestaande schedulers.
4. **Afsluitnorm:** deze PR is aanvankelijk uitsluitend SOURCE_CANDIDATE. Vereis beschermde merge, succesvol origineel browser-assurance-resultaat met rapport/artifacts en geautoriseerde Netlify-preview (indien toepasselijk). Log verificatietijd, run IDs, exacte SHA en providerrespons in de bestaande ONE BRAIN-keten, niet als verzonnen groen. De Netlify-productie is niet veranderd zolang deze PR niet gemergd en onafhankelijk afgetekend is.

## ONE BRAIN

- `brain/learning/2026-11-05-cross-browser-ffmpeg-postinstall-http-504.json`
- `brain/learning/2026-11-05-netlify-preview-401-fast-failure.json`
- Bestaande Portal V2-agent en Netlify-session-health-skill worden op deze twee regels aangevuld; geen nieuw agentsysteem.

Actuele overige rode proceslijn: [Social Publication Recovery run 42047493316](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42047493316) geeft `http=409`, `MEDIA_ASSET_REQUIRED` op Instagram. Dit is **niet** gerepareerd met de CI-aanpassing. De originele social owner en [incident #5232](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232) blijven eigenaar; geen fallback naar parallelle publisher, geen artistieke kwaliteitseis of consent omzeilen.
