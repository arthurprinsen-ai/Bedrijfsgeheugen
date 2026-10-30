# Powerhouse: officiële regelgeving ≠ HTTP 202 — herstel 30 oktober 2026

## Oorzaak en werkelijk bronbewijs

De oorspronkelijke `Regulatory Source Watch` op GitHub main `6134d2cc1030b87b77441ee110d7a33fd367a620`, [run 41036966479](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41036966479), las vier bronnen. Drie EUR-Lex URL's (AI Act, NIS2, AVG/GDPR) antwoordden met **HTTP 202 en 2.035 bytes HTML**. Dit is geen geverifieerde inhoudelijke wetgevingswijziging. De bestaande monitor kende aan ieder antwoord toch een officiële `contentSha256` toe, schreef `changed=true` en plaatste de antwoorden in dezelfde inhoudelijke bewijsstroom als echte wettelijke brondocumenten. Zelfs de vorige statusprojectie van 24 september had EUR-Lex HTTP 202; historische hashes mogen daarom niet met zekerheid als wetstekst worden behandeld. Het NCSC gaf HTTP 200 terug met circa 408 kB HTML: dat is transport- en vormbewijs, **niet** automatisch bewijs van een inhoudelijke wetswijziging.

De originele run schreef de ruwe bronwaarnemingen naar bestaande Powerhouse-bronnen, pushte één branch `writer/regulatory-source-watch/41036966479`, maar `gh pr create` faalde met `GitHub Actions is not permitted to create or approve pull requests (createPullRequest)`. De oorspronkelijke repo heeft een ouderheidsbewijs van een *eerder* werkende Actions-writer; dat geldt niet als actuele autorisatie: het nieuwe providerantwoord is beslissend.

## Eén bron, één lus, geen onbewijsbare promoties

De bestaande `tools/regulatory-source-monitor.py` classificeert de providerresponse voor het berekenen van `changed`:
- Alleen exact **HTTP 200**, dezelfde goedgekeurde HTTPS-host, HTML MIME, substantiële HTML-lengte en geen bekende challenge/interstitial worden `VERIFIED_HTTP_DOCUMENT` (nog **geen** semantische rechtswijziging).
- HTTP 202, foutcode, onvolledige respons, afwijkend MIME, redirects naar een andere host of challenge blijven `UNVERIFIED_*`.
- Niet-geverifieerde responsen worden alleen met tijd, HTTP-status, kwaliteit en diagnostische hash in de **bestaande** checks + Powerhouse-heartbeat geregistreerd. De canonieke `data/regulatory-source-state.json` verandert niet voor die bron; geen nieuwe `regulatory-content:`-raw event, geen voortijdig `changed=true`, geen regulation/recompute trigger.
- Het originele `tools/regulatory-brain-ingest.py` geeft `source_content_verified=false` expliciet mee en accepteert voor officiële content alleen strikt `VERIFIED_HTTP_DOCUMENT`.
- De bestaande GitHub workflow bewaart de kandidaatbranch en meldt `CANONICAL_REGULATORY_PR_PERMISSION_DENIED` met failure-status als GitHub PR-creatie weigert. Geen alternatieve schrijver, tweede scheduler, repository-settingbypass of denkbeeldige geautoriseerde PR.

De al gepushte kandidaat `3852c965...` blijft **UNMERGED** en mag **niet** rechtstreeks worden gemerged: hij bevat drie ongeldige HTTP-202-wijzigingsclaims. Een nieuwe betrouwbare brondetectie mag pas via de oorspronkelijke beschermde schrijver en dezelfde releasepoorten worden geaccepteerd. Voor geautoriseerde PR-aanmaak is een actuele toegestane GitHub App/Actions-instelling of bevoegde eigenaar nodig; oude succesvolle run IDs geven die bevoegdheid niet.

## Agent-, ONE BRAIN-, portaal- en releasebewijs

CANONICAL: `brain/learning/2026-10-30-regulatory-source-202-pr-denial-v1.json`. Het oorspronkelijke ONE BRAIN registreert afzonderlijk `powerhouse|regulatory|http202-not-legislative-content|20261030-v1` en `powerhouse|regulatory|actions-pr-create-denied|20261030-v1`. Echte providerwaarnemingen blijven in `public.powerhouse_evidence_source_observations` (geen apart gegevensplatform). Agents melden onzekerheid als `UNVERIFIED`; compliance-controles en portaal tonen geen nieuw juridisch feit of GREEN enkel vanwege een bronhash of GitHub branch.

Regressie: `tests/brain-regulatory-source-http202-pr-failclosed-20261030.test.mjs`; bestaande `tests/regulatory-organism-feed.test.mjs` en writer-allowlist. Beschermde Required/BRAIN/CodeQL, onafhankelijke echte runtime/bronproof en originele GitHub PR-readback zijn nodig voor terminal groen. Geen Netlify deploy vereist voor een uitsluitend Python/workflow/skill-documentatiecorrectie: een live werkende volgende natuurlijke watcher moet apart worden bewezen.

**Grenzen:** geen echte inhoudelijke EUR-Lex-update bevestigd; geen versnelde herpublicatie, geen mutatie van klantcompliance zonder bewijs en geen versoepeling van OAuth/toestemming/PR-bescherming.