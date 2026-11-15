# Groen-draaiboek — van wijziging naar live, per poort

Bijgewerkt 2026-11-08. Leesroute per poort: je ziet een rode check of blokkade, zoekt de melding op en volgt de vaste fix. Dit vervangt de foutenregisters niet. Bron van waarheid blijft `docs/brain/delivery-failure-lessons.json`, `config/delivery-prevention-rules.json` en `brain_failure_registry` in Supabase. Uitgebreide versie met queue-stand en errors zonder oorzaak: Notion, "Groen-draaiboek" onder de Powerhouse Direct Knowledge Base.

## Werkwijze (besluit Arthur, 2026-11-08, geldt voor alle agents en chats)

Autonoom uitvoeren, niet terugvragen. Kies zelf de beste route, voer uit, bewijs en leg vast. Stoppen en vragen mag alleen bij wat een agent niet zelf kan of mag: kosten die bevestiging vragen (bijvoorbeeld een Supabase-preview-branch), providerinstellingen en OAuth die alleen Arthur kan doen, en onomkeerbare dataverwijdering. Beschermde checks, vetopoorten en kwaliteitsgates worden nooit omzeild. Groen komt via de beschermde PR-route. Eindig een sessie niet met "zal ik...?" maar met wat gedaan is, wat bewezen is en wat de volgende agent oppakt.

## 1. De vijf minuten vóór je begint

1. Draai `node tools/delivery-preflight.mjs shared --action "<wat je gaat doen>"`. Blokkeert hij op een regel, noem de regel en volg hem. `--ack` is een verklaring, geen bewijs.
2. Zoek open PR's op je branchnaam én op de bestanden die je raakt. Eén sessie tegelijk voor `delivery-failure-lessons.json`, `delivery-prevention-rules.json` en `planned-action-triggers.json`.
3. Lees checks op de exacte head-SHA, niet op een branchnaam en niet van een eerdere head.
4. Past er een regel op wat je gaat doen, volg die. Wil je afwijken: zeg het eerst.
5. Nieuwe fout, blokkade of stilstaande lus: vastleggen in dezelfde beweging als het herstel, via de bestaande route (`brain_failure_registry`, `scripts/brain/chat-learning-preflight.mjs`). Geen tweede register.

## 2. De weg naar live

1. Branch en PR. Nooit direct naar `main` (422).
2. Nieuw bestand: naam laten passen op een bestaande lane-prefix; testbestand in een lane-workflow of onder `tests/brain-*`.
3. PR-body: `Scope-Budget` en `Change-Scope` gelijk aan het aantal gewijzigde bestanden.
4. Minstens één gewijzigd bestand onder `brain/learning/` met `compiler.failure_class`, `evaluation.historical_replay` en evidence, ook bij een testwijziging.
5. Verplichte checks op de exacte head: `test`, `hygiene / admission`, CodeQL.
6. Branch achter op main: `update-branch`, wachten tot de checks opnieuw gedraaid hebben, dan mergen.
7. Na merge: Netlify READY op exact dezelfde commit, dan readback van de uitkomst, dan leerrecord. READY bewijst alleen de gepubliceerde versie.
8. Statusclaim: noem de checknaam en het tijdstip. Nooit "main is groen" zonder alle checks te noemen.

## 3. Rode check of melding, betekenis, vaste fix

| Rood of melding | Betekenis | Vaste fix |
| --- | --- | --- |
| `test` en `hygiene / admission` samen rood | Eén oorzaak, `test` hangt aan de hygiene-uitkomst | Learning-record meenemen (`NO_CHANGED_BRAIN_LEARNING`, `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE`); Scope-Budget kloppend maken |
| `LEARNING_FAILURE_CLASS_REQUIRED` | Learning-JSON mist `compiler.failure_class` of `evaluation.historical_replay` | Velden toevoegen; gate nooit versoepelen |
| Admission: `Cannot find package 'parse5'` | Evaluatie draait zonder npm-pakketten | Verwijs in een learning-record alleen naar dependency-vrije tests onder `tests/brain-*` |
| "unclassified delivery path" | Nieuw bestand valt buiten `config/brain-delivery-system.json` | Bestand een naam geven die op een bestaande lane-prefix past |
| Test draait nooit | Niet genoemd in een lane-workflow | Registreren in `lane-*.yml` of `required-test.yml` |
| `STATIC_I18N_CACHE_INCOMPLETE`, main rood na blogmerge | Twee sleutelweergaven: gecommitte HTML en productieketen | Tweede prepare-pass op de gecommitte boom met `--validate-cache` (`DAILY_BLOG_I18N_MUST_COVER_COMMITTED_TREE`); productieketen niet lokaal draaien |
| Migratie-lock loopt achter | Migratie toegepast zonder lock-regel | Migratie en lock-regel in dezelfde wijziging; mag dat niet, dan een aparte lock-only PR na provider-readback |
| Supabase Preview: `not associated with any Supabase Branch` | Geen preview-branch gekoppeld; aanmaken vraagt kostenbevestiging | Kostenbevestiging is aan Arthur; volledige branchnaam van GitHub kopiëren |
| Supabase Preview: `failed to bundle function` | Oude `jsr:`-imports, op main al hersteld | Branch rebasen op huidige main |
| Supabase Preview: duplicate key bij oude migraties | Replay van oude migraties | Branch-reset en nieuwe run |
| `test` rood met jobs `cancelled` | Nieuwe commit stopte de oude run | Geen echte fout; wachten op de run van de nieuwste head |
| 405 "required status check is expected" | Branch loopt achter | `update-branch`, wachten, mergen |
| PR-body aangepast, check blijft rood | Body-wijziging start geen nieuwe run | PR sluiten, 5 s wachten, heropenen, of run opnieuw |
| 409 op Contents-API | Brain-agents committen continu | Git Data API (blobs, tree met `base_tree`, commit, ref) of `GITHUB_COMMIT_MULTIPLE_FILES` met `base_branch` |
| `NETLIFY_PREVIEW_AUTH_REQUIRED` (401, `preview`) | Netlify-autorisatie voor niet-productiebezoekers ontbreekt | Providerinstelling voor Arthur; nooit omzeilen |
| `Pages changed` neutraal, PR toont unstable | Gedrag van de Netlify-app | Negeren; alleen de verplichte checks tellen |
| Cross-browser: Firefox start niet | HOME-eigenaar klopt niet in de container | HOME-eigenaar gelijk aan het effectieve proces; sandbox en visuele gates niet verlagen |
| Cross-browser: `pipefail` faalt | Container gebruikt POSIX sh | `defaults.run.shell: bash` |
| Cross-browser: time-out op 181 apt-pakketten | Playwright install met deps over trage mirror | Versie-passende prebuilt Playwright-container |
| `ffmpeg-static` postinstall HTTP 504 | Niet-gerelateerde npm-postinstall | Lifecycle-scripts alleen onderdrukken voor screenshot-only CI; browsers en CLS-gates blijven |
| Janitor `branch_archive_sweep` 403 op archieftag | Koppeling mist recht om tags te maken | Eigenaar is #5333; geen tweede fix |
| Wijziging in `.html` verdwijnt na deploy | HTML is invoer, generators overschrijven | Beginnen bij `netlify.toml` en `tools/` |

## 4. Publicatieblokkades

| Kanaal | Melding | Vaste fix |
| --- | --- | --- |
| Blog | `GENERATED` blijft staan | `approved_at` ontbreekt; nooit direct in de database zetten. Goedkeuring via `record_content_publication_state` (venster 6 uur, veto wint) |
| Blog | `EXPIRED_FUTURE_EVENT_CLAIM` | Gate niet omzeilen; afkeuren met `evidence.veto`, status afschrijven houdt niet |
| Blog | Kopregels of lijsten fout | Renderer-controle `MARKDOWN_LIST_IN_P`, `MARKDOWN_LIST_IN_H2`, `HEADING_TOO_LONG` |
| LinkedIn bedrijf | `PRE_PUBLISH_GATE_BLOCKED`, `DISTINCT_VERIFIED_STORY_REQUIRED` | Nieuw, onafhankelijk geverifieerd verhaal vóór generatie; anders HOLD |
| LinkedIn | `GLOBAL_POST_DUPLICATE_BLOCKED` | Zelfde verhaalfamilie; nieuw verhaal nodig |
| LinkedIn persoonlijk | `EXACT_PROVIDER_PUBLICATION_PROOF_MISSING` | Eerst extern effect nagaan, nooit blind opnieuw publiceren |
| Instagram | `MEDIA_ASSET_REQUIRED`, `MIRA_PRODUCER_CLAIM_REQUIRED` | Producent-sessie ontbreekt; gezichtsdrempel 0,940 blijft; geen tweede scheduler |
| Composio | Verbinding ACTIVE maar publiceert niet | ACTIVE is geen bewijs; account, scopes en readback controleren in het exacte serverproject |
| Buffer | 429 met lange retry-after | Respecteren; geen tweede route |

## 5. Niet bewezen

- Dat elke agent dit draaiboek leest; dat bewijst pas een preflight-run die het als bron noemt.
- Dit draaiboek is samengesteld uit de foutenregisters, START HIER, `brain_failure_registry` en eerdere chats; niet elk van de 627 patronen is regel voor regel gescand.
- Rijen zonder guard in de repo zijn REGEL, geen AFGEDWONGEN.

## 6. Meting 8 november 2026: waar de rode runs vandaan komen

Laatste 30 rode runs per workflow, gelezen via de GitHub-API op 2026-11-08 (stappen die faalden, geteld per run).

| Workflow | Falende stap (aantal van 30) | Lezing |
| --- | --- | --- |
| Required test (20 pull_request, 10 workflow_dispatch) | `test` aggregatiestap 29; daaronder admission: "Admit one canonical candidate" 10, "Enforce canonical integration closure" 6, "Require canonical learning evidence" 3; preflight "static English cache" 2; website/browser 2 | Meestal een afwijzing van de PR-bundel door de poort, geen codefout. Voorkom met sectie 1 en 2 |
| Unified Brain Delivery (30 workflow_dispatch) | admission: closure 8, learning evidence 7, canonical candidate 6; lanes (backend) 3 | Zelfde patroon: bundel-eisen, niet de code zelf |
| Obligation Terminal Closure | "Verify exact-head critical delivery gates before terminal closure" 28; "Require explicit Supabase Edge Function provider readback" 5 | De sluitstap faalt als een kritieke poort op de exacte head niet groen is; eerst die poort herstellen |
| Portal V2 Live Preview (30 workflow_run) | "Wait for exact Netlify preview SHA and pin immutable deploy" 30 van 30, laatste 8 nov 12:39 UTC, ook na merges naar main | Blijvend rood. Eerder vastgelegde oorzaak: `NETLIFY_PREVIEW_AUTH_REQUIRED` (401), providerinstelling voor Arthur. De HTTP-code van deze 30 runs is niet apart nagelezen |

Regel: een rode `test` of `Unified Brain Delivery` betekent vrijwel altijd een gemiste bundel-eis (canonical candidate, integration closure, learning evidence). Lees eerst welke admission-stap faalde voordat je code aanpast. `Portal V2 Live Preview` rood na een merge is op dit moment bekende ruis; laat hem niet de reden zijn om een verplichte check te vertrouwen of te wantrouwen.

## 7. Wat de zelfbewaking-alarmen betekenen (gemeten 8 november 2026)

`intern.bg_brein_zelfbewaking()` meldt elk uur wat niet werkt in `brain_failure_registry` (fingerprint `brein-status|<bron>|<oordeel>`). Op 8 november 12:41 UTC: 17 gecontroleerd, 1 niet werkend, 0 meldfouten. Het ene niet-werkende onderdeel is `pg_cron` FOUT ("Nachtelijke jobs (alle)", laatst bewezen 2 november 06:00 UTC, grens 26 uur).

| Alarm | Wat erachter zit | Wat je doet |
| --- | --- | --- |
| `pg_cron` FOUT (1.371 voorkomens sinds 10 sep) | Twee cronjobs falen terugkerend: `bg-content-publication-daily-assert` (dagelijks 19:35 UTC, elke dag 31 okt t/m 7 nov, `DAILY_PUBLICATION_INVARIANT_FAILED expected=4 non_terminal=1 tot 4`) en `powerhouse-revenue-intelligence-snapshot-15m` (`canceling statement due to statement timeout` bij het vullen van `powerhouse_revenue_command_center_snapshot_v1`, onder meer 31 okt, 2 nov, 6 nov en 8 nov) | De dagelijkse assert is het bedoelde alarm voor een gemiste publicatie (Instagram `BLOCKED` met `MEDIA_ASSET_REQUIRED`, blogs `GENERATED` zonder goedkeuring). Herstel de publicatie, niet het alarm. Voor de snapshot-timeout bestaat op main geen fix: #4630 (materialiseer person intelligence één keer) is gesloten zonder merge en vroeg tenantpariteit en echte performancevalidatie; nieuw werk vraagt dezelfde validatie |
| `bg-calendly-sync NOOIT_BEWEZEN`, `bg-experimentcyclus NOOIT_BEWEZEN` | Laatst gezien 27 okt en 3 nov; de cronjobs slagen nu | Historisch. Sluiten via de Brain-route met dit bewijs |
| `bg-native-content-generate`, `bg-externe-signalen`, `bg-bedrijfsnieuws`, `brain_run_due_value_evaluations`, `powerhouse-runtime` VEROUDERD | Laatst gezien resp. 27 okt, 31 okt, 3 nov, 20 okt en 8 okt; staan nu niet meer in de lijst met niet-werkende onderdelen | Historisch. Sluiten via de Brain-route met dit bewijs |
| `growth-datahub-ingest`, `bg-interactie` VEROUDERD | Bezoekersmetingen (grenzen 12 en 6 uur); event-gedreven zonder eigen cron, bij weinig en consent-beperkt verkeer lang stil. Op 8 november 12:41 UTC niet in de lijst met niet-werkende onderdelen | Een drempel in uren past slecht bij een bron die alleen schrijft als er bezoekers zijn; beoordeel op verkeer, niet alleen op leeftijd |

Regel: lees bij `pg_cron` FOUT eerst `cron.job_run_details` en de `return_message`; de naam van het alarm zegt niet welke job faalt. Zeg nooit dat een brein-status "groen" is zonder de lijst met niet-werkende onderdelen te noemen en het tijdstip.
