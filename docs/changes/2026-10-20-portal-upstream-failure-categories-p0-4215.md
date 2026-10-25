# P0 #4215 — veilige upstream-foutclassificatie in bestaande portal-gateway

Datum: 20 oktober 2026. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

## Bewezen fout en juiste telling
De immutable Netlify deploy hook voerde **één** echte Identity-geauthenticeerde GET naar `/api/portal-ondernemersdata` uit, die 502 gaf. De 30 meldingregels in GitHub release-readback run #39430198530 zijn daaropvolgende polls van **dezelfde opgeslagen FAILED proof** in Netlify Blobs, géén 30 onafhankelijke HTTP-fouten. Edge-productionsqlindexen zijn hersteld. Het gateway-HTTP-502 bewijs is oud en blijft open tot een nieuwe immutable live proof slaagt. De Supabase Edge v221 bevat nu credential-hashparity uit gemergede PR #4559, maar dat is nog geen geauthenticeerde klantreadback.

## Gerichte oplossing
De bestaande Netlify gateway handhaaft Identity tenantresolutie, service-auth, fail-closed tenant shape, 23s deadline, no-store op fouten en de bestaande statuscodes. Een mislukte Edge-oproep wordt **uitsluitend server-side** als een vaste code geclassificeerd: config, deadline, expliciete upstream HTTP-status, verwachte read-stage SOURCES/PUBLICATIONS/EXTERNAL_SIGNALS/DOMAIN_REGISTRY/SOURCE_CATALOG/SIGNAL_PROJECTION/COMPANY_IMPACT/CANONICAL_ACTIONS/TENANT_ACTIONS/INTELLIGENCE_SNAPSHOT, response shape, tenant scope of network. Onbekende waarde wordt nooit gelogd. Er worden geen nieuwe retries, schedulers, RLS-uitzonderingen, credentials of sociale verzendingen toegevoegd.

## Acceptatie
Exact-head Required CI + CodeQL, Netlify preview en protected merge, exact Netlify production readback na Edge v221, authentieke HTTP 200 met correcte tenant scope en payload vorm. De deploy hook gebruikt tijdelijk één synthetische tenant en moet bovendien worden aangevuld door onafhankelijke **twee-tenant write→revision→Brain/Heartbeat ACK→readback** met juiste broninformatie. Alleen bewijs verleent LIVE_PROVEN.
