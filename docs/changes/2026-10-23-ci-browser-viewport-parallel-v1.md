# CI/CD: drie viewport-sweeps parallel, zonder kwaliteitsverlaging

**Canonieke eigenaar:** [CI-incident #4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). Geen extra scheduler, agent, jobwatchdog, releaseverantwoordelijke of browser-orakel.

## Productiebewijs en bottleneck

Twee onafhankelijke complete GitHub Required-runs van PR #4753 slaagden: run `39938653908` duurde 339 s (browser 225 s, backend 11 s); run `39939651165` duurde 355 s (browser 223 s, backend 14 s). De bestaande `lane-website.yml` voert telefoon/tablet/desktop-sweeps sequentieel uit in dezelfde browserjob. Andere agents wijzigden `main` tijdens deze lange checks, waardoor de vereiste actuele basiscommit herhaaldelijk verouderde. Een verwachte tijdwinst is **nog niet aangetoond**.

## Veilige implementatie

De bestaande `standalone-visibility-check.mjs` accepteert optioneel `UI_VR_VIEWPORT_SHARD`. Bij afwezigheid blijven **alle drie** de viewports behouden; een onbekende shard faalt direct. `selectVisibilityViewports` is een pure selector, zonder browserinteractie of gewijzigde veiligheidsgrenzen.

De bestaande herbruikbare `lane-website.yml` bevat nu aanvullend `browser-visibility` als een maximaal drie gelijktijdige matrixjobs: `phone`, `tablet`, `desktop`. Iedere shard controleert de **volledige publieke sitemap**, HTTP en DOM, zichtbare header/main/H1, occlusie, minimale inhoud en **CLS niet hoger dan 0,100**, op hetzelfde exact gepinde kandidaatcommit. Elk falend matrixlid moet de `website` reusable workflow en daarboven de beschermde `Required test` blokkeren.

De oorspronkelijke `browser`-job behoudt Playwright, routes desktop/mobiel, checkout inclusief serverbevestiging, menu- en high-risk visuele/SEO-contracten; alleen de gedeelde zichtbaarheidssweep wordt daaruit verplaatst. Er is geen test verwijderd, geen tijdslimiet verhoogd, geen bypass of tweede scheduler toegevoegd.

## Bewijs en grenzen

`tests/brain-website-browser-parallel-v1.test.mjs` dwingt de exacte drie viewports, matrix-dekking, fail-closed onbekende shard, alle oorspronkelijke browserchecks, identieke CLS- en routedoelen, exacte git SHA en verplichte Required-propagatie af. De volledige browserjobs moeten daarnaast op een echte GitHub-kandidaat slagen.

Vergelijk na de eerste voltooide provider-runs de **langzaamste shard + overige browserchecks**, de totale Required-walltime, testfouten, retryratio en gecorrigeerde missers. Twee basisruns zijn onvoldoende voor een statistisch p95 en leveren geen garantie voor een versnelling. Versnel geen rollout als de browser- of auditdekking daardoor onvolledig blijkt.
