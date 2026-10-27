# Netlify reserve-deploy: accountdetectie en paginering

## Vastgestelde tekortkoming
De OIDC-beveiligde Supabase-edgefunctie vroeg bij Composio `/api/v3.1/connected_accounts?limit=100&account_type=ALL` op en onderzocht uitsluitend de eerste resultatenpagina. Bij meer dan 100 accounts kan een geautoriseerde `netlify_mcp`-verbinding op een volgende pagina staan. Een onvolledige scan werd vervolgens ten onrechte samengevat als `composio_netlify_account_not_public`.

## Oplossing
Dezelfde backend doorloopt nu `next_cursor` met een grens van twintig pagina's, HTTP-timeout, herhaalde-cursorbeveiliging en strikte verificatie van `ACTIVE` + `user_id`. Een onvolledige scan faalt expliciet, zonder de fout te vermommen als ontbrekende account. Diagnostiek legt alleen paginatelling, bekeken accountaantal en gevonden/ontbrekend vast — nooit credentials, account-ID's of gebruikersidentiteiten.

## Belangrijke autorisatiegrens
`account_type=ALL` ondersteunt private en gedeelde accounts die **aan het project van de API-sleutel zijn toegestaan**. Dit verleent geen rechten op accounts uit andere projecten. Als de volledige scan nul bevoegde Netlify-connecties vindt, vereist herstel een door de eigenaar geautoriseerde project-/serviceverbinding. Niet automatisch accounts delen of tokens verplaatsen.

## Acceptatie
Regression: `node --test tests/brain-netlify-composio-pagination.test.mjs`.
Protected merge met Required CI/CodeQL; daarna Supabase-edgefunctie exact-source deploy, versie-readback en een OIDC-geauthenticeerde health/proxy-test vanuit de toegestane GitHub-workflow. Alleen een echte provideractie met productie-readback bewijst reserve-deployherstel. P0 #4447 blijft anders open.

## Terugkerende controleregel
De bestaande, uitsluitend op `main` vertrouwde GitHub-workflow krijgt een dagelijkse OIDC-health-probe en een handmatige `authority_probe`. De probe vraagt alleen `action=health` aan de bridge, publiceert nooit broncode en rapporteert alleen HTTP-status en foutcode. Een mislukte bevoegdheidscontrole geeft een rode run en verwijst naar P0 #4447. Een groene healthcheck is nog geen bewijs van een geslaagde provider-deploy.
