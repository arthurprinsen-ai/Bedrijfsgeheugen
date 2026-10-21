# Portal V2: één klantgebonden contextlaag over alle pagina's (21 oktober 2026)

Obligation: `portal-4547-one-organism-context-20261021`. Parent issues: [#4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547), [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Doel en geleverde software
- **Bestaande Winstnavigator geactiveerd** via `portal-v2/app.js`; gedeelde `portalDomainState`/`portalStateClient`, eigen bestaande `winstnavigator.js/css`, vanaf de ondernemershomepage één klik om het scenario te openen. Geen tweede scenario-model.
- **Alle geregistreerde V2-pagina's** krijgen dezelfde contextuele uitleg boven de detailinhoud: huidig ondernemersdoel, relevante bedrijfslaag, direct beschikbare vervolgstap en bronstatus. Routeautoriteit blijft `page-registry.js`.
- **Causale wijzigingsketen** hergebruikt `bg:portal-impact` (review/pending), `bg:portal-brain-synced` (alleen aanwezige canonical ACK), `bg:portal-server-refreshed`, en bestaande interne navigatie. De widget voert geen nieuwe fetch of write uit.
- **Relevante ecosystemen**: Supabase, Brain, Powerhouse, Heartbeat, GitHub, Netlify, Notion en Composio worden alleen per context getoond als mogelijke bronnen of acties. Een platformnaam, API-key of repo-deployment is **geen bewijs** van klantautorisatie, provider-sync of concrete zakelijke uitkomst.
- Provider-proof is alleen zichtbaar indien de al bestaande geauthenticeerde tenant-runtime zowel een bronverwijzing als een geldige recente source timestamp en `healthy=true` bevat; anders `Verbinding niet bevestigd`. Werkelijke koppelingen worden beheerd via bestaande Koppelingen/Control Center/Databronnen. Nooit provider secrets naar browser.
- Op logout/tenantwissel worden bron- en wijzigingsweergave gereset. Alle berekende winst, besparing, complianceconclusie of AI-forecast blijft afhankelijk van afzonderlijke canonieke bewijsbronnen.

## Wat expliciet niet is geleverd
Niet alle externe provider-integraties, accounts en API-autorisaties zijn geactiveerd. De end-to-end keten op echte klanten (scan → opslag → Brain → Powerhouse → Heartbeat → aangetoonde bron/outcome) is niet alleen door deze UI-wijziging bewezen. Evenmin zijn alle individuele pagina-visuals voltooid of wordt een tweede scheduler geïntroduceerd.

## Beveiliging en verificatie
- Browser/demo wordt afgezonderd; onbekende providerstatus blijft onbekend; geen PII in events.
- Functionele tests `node --test portal-v2/tests/connected-journey.test.mjs` en `node --test tests/brain-portal-connected-journey-v1.test.mjs`; bestaande protected Required/BRAIN/CodeQL.
- Productieacceptatie vóór `LIVE_PROVEN`: bron- en doelreadback voor twee onafhankelijke klantaccounts; cross-tenant negatieve test; wijziging op A zichtbaar als gecontroleerde doorwerking op gekoppelde pagina, niet op B; extra Netlify exact-commit en mobiel/touch/keyboard Winstnavigator.
- PR mag de bestaande #4215 RLS, databaserate-limits, Heartbeat of herstel-executors niet vervangen of uitzetten.
