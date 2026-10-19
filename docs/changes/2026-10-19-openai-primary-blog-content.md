# OpenAI primaire contentaanvoer en volledige blogvertaling

## Vastgestelde storingen
- Powerhouse daily blog: GitHub Actions run [39174978217](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39174978217) strandde vóór het openen van de beschermde PR op een Anthropic-tegoedfout tijdens de verplichte Engelse vertaling. Er is daarom geen rechtmatig publicatiebewijs.
- Native approved blog supply: run [39236467385](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39236467385) faalde wegens het ontbreken van GitHub OIDC voor de Anthropic Code Action.

## Technische wijziging
- `native-approved-blog-supply.yml` roept direct via `OPENAI_API_KEY` de bestaande OpenAI Responses-interface aan. De nieuwe generator levert één strikt schema-valide kandidaat met titel, slug, zoekwoord, meta, Nederlandstalige blogtekst en aantoonbare BRAIN-redenering.
- De workflow behoudt de bestaande controle van lengte, structuur, kwaliteit en goedgekeurde Notion-voorraad. De OpenAI-uitvoer schrijft niet rechtstreeks naar publicatie of een provider.
- `powerhouse-daily-blog.yml` gebruikt uitsluitend OpenAI voor het vullen van de Engelse cache. De `build-localized-routes.mjs` bouwt en valideert de cache met OpenAI, zonder eerst een Anthropic-call te doen. Ontbrekende OpenAI API-sleutel of onvolledige vertaling blijft terecht een blokkade.
- De OpenAI-transportlaag neemt Retry-After over; ongeldige JSON, incomplete antwoorden of veranderde URLs/placeholders blijven afkeur.
- Netlify en reguliere offline productiebuild blijven de Engelse cache verplicht volledig eisen. Geen nieuwe scheduler of parallelle publicatie-executor.

## Vereiste acceptatie
Geschikte `OPENAI_API_KEY` als GitHub Actions secret, geslaagde regressietests, Required CI, CodeQL, beschermde merge, werkende OpenAI-output, complete NL/EN-cache, succesvolle Netlify-deploy en openbare URL/readback zijn elk afzonderlijk vereist. Een groene AI-aanroep betekent nooit dat een blog gepubliceerd is. Voorgaande blog- en e-mailincidents blijven open totdat providerbewijs aanwezig is.

## Scope
Deze correctie betreft de twee geobserveerde productieblokkades (dagblog en native approved blog supply). Andere historische AI-writers worden niet stilzwijgend uitgezet; eventuele Anthropic-afhankelijkheden buiten deze kanalen vereisen eigen reconciliatie.

## Weekblog en bestaande artikelen bijwerken
De afzonderlijk ingeplande workflows `weekblog.yml` en `blog-bijwerken.yml` gebruiken voortaan `openai/codex-action@v1`, met `OPENAI_API_KEY`, `permission-profile: ":workspace"`, `safety-strategy: drop-sudo` en uitsluitend de vertrouwde `github-actions[bot]` via `allow-bots: true`. De oude Anthropic API-test uit Weekblog is verwijderd. De agent mag alleen via de bestaande exact-bestands-allowlists en candidate-PR-paden werken; geen directe wijziging op `main` en geen bypass van SEO/JSON-LD checks. Voor Weekblog is de oude mislukking aangetoond in [run 39238320820](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39238320820).

## Privacybeveiliging vóór OpenAI
De beveiligingsreview stelde terecht vast dat een volledig lokaal BRAIN-JSON-bestand rechtstreeks in een externe netwerkrequest terecht kon komen. Dit is aangepast: `selectApprovedPublicTopic` leest BRAIN-data alleen lokaal om te kiezen uit een beperkte set publiek geschikte redactiethema’s met vaste, niet-klantgebonden teksten. **Geen** e-mailadressen, bedrijfsnamen, accountinformatie, commerciële bedragen of ruwe BRAIN-records worden doorgegeven aan OpenAI. Het model mag geen concrete prestatieclaims over klanten doen zonder onafhankelijk geverifieerd publicatiebewijs. Test: `tests/brain-openai-native-approved-blog-20261019.test.mjs` controleert dat een met gevoelige records gevulde input geen enkel gevoelig veld in de uitgaande netwerkbody oplevert.
