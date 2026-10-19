# Dagelijkse Powerhouse-blog — OpenAI-releaseherstel (19 oktober 2026)

## Probleem en geverifieerd bewijs

De eerdere canonieke blogrun mislukte in de statische vertaalbuild: `STATIC_I18N_OPENAI_KEY_MISSING`. Anthropic veroorzaakte eerder een blokkade door uitgeput tegoed. De bloggenerator en de NL→EN statische vertaalprovider zijn inmiddels in `main` vervangen door OpenAI; alleen een werkelijk door GitHub Actions gelezen `OPENAI_API_KEY` mag worden gebruikt.

Na het toevoegen van de GitHub-secret is mislukte run [39272994778](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39272994778) opnieuw gestart. De canonieke writer heeft voor 2026-10-19 precies één beveiligde kandidaat gemaakt: [PR #4483](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4483), met een brongestuurd Nederlandstalig artikel, index/RSS/sitemap en `config/bg-static-i18n-en.d/powerhouse-blog-2026-10-19.json`.

## Waarom het nog niet 'live bewezen' is

Een succesvolle GitHub-kandidaat is niet hetzelfde als publieke publicatie. GitHub Required CI wees de eerste poging van #4483 af met `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE`: activiteitledger, leerbewijs en menselijke documentatie ontbraken. Die drie onderdelen worden binnen **dezelfde** protected PR toegevoegd, waarna de verplichte checks op de nieuwe HEAD opnieuw moeten slagen. Productieacceptatie vereist beschermd mergen, Netlify-publicatie en readback van de exacte canonieke URL inclusief content-ID.

## Blijvende borging

- Eén canonieke schrijver per dag, geen parallelle publicatie of stille fallback naar Anthropic.
- De OpenAI-key blijft uitsluitend GitHub-secret; nooit in PR, logs, gegenereerde website, testfixture of documentatie.
- Inhoud vereist een brongestuurd artikel en kwaliteitspoorten; geen verzonnen claims of bewijs.
- Elke Engelse vertaling moet aantoonbaar volledig en gecontroleerd in de versiegebonden cache staan, vóór merge.
- `LIVE_PROVEN` pas na de actuele Netlify- en publieke URL-controle. Zonder bewijs blijft de status open; een geslaagde stap mag niet als volledige publicatie worden voorgesteld.
- De onafhankelijk geblokkeerde persoonlijke LinkedIn-, Instagram- en commerciële e-mailsporen behouden hun eigen bron-/media-/ontvangerscontroles.

Controlepunten: [GitHub PR #4483](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4483); [opnieuw gestarte workflow](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39272994778).

## GitHub required-check race 19 oktober

Op exact dezelfde PR-head `2e32f1107ff819b7cdf922935eb80ab55c536241` registreerde een voortijdige Required CI-run [39288905478](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39288905478) een mislukte `test` nadat de bijbehorende Netlify-bouw was geannuleerd. De latere, volledige Required CI-run [39289096164](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39289096164) slaagde inclusief Netlify-build, browserregressie en laatste `test`; CodeQL [39288905455](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39288905455) slaagde eveneens. GitHub blokkeerde desondanks de beschermde merge met `Required status check "test" is failing` door het oude resultaat op dezelfde SHA. Dit is geen reden om de branchbescherming, de stale-failure-controle of het publicatiebewijs te omzeilen. Dezelfde kandidaat krijgt uitsluitend deze gedocumenteerde leeraanvulling op een nieuwe SHA, waarna de normale PR-checks de nieuwe exacte bron beoordelen. De publicatie wordt pas `LIVE_PROVEN` na merge, deploy en exacte publieke readback.
