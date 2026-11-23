# Powerhouse publicatielus — Netlify-observability releaseclassificatie (29 oktober 2026)

## Aanleiding

De productie-P0 Mira-fix is via beschermde PR #5145 gemerged en de Supabase-ensurefunctie is direct in productie geverifieerd. De oorspronkelijke mediajob bleef bij twee bestaande ensure-ticks identiek (zelfde ID, history, afkeuring 0.900, attempts en timestamp). De private ONE BRAIN-registry is naar VALIDATED gepromoveerd; dit is nog geen Meta-publicatie.

De mee-gemergede correctie in `brain/observability/publication-evidence-readback.mjs` werd door `production-release-readback` onterecht als governance-only aangemerkt: `NETLIFY_DEPLOYMENT_APPLICABILITY NOT_REQUIRED`. Maar `netlify/functions/powerhouse-observability.mjs` importeert dat bestand direct en Netlify bundelt die bron in de uitgegeven site. De gepubliceerde Netlify deploy wees nog naar SHA `6487786733cd332edd777af3881e68aca806bf92`, niet naar de nieuwe source.

## Gerichte oplossing zonder schaduw-release

De bestaande `NETLIFY_RUNTIME_EXACT` classifier markeert de drie rechtstreeks door Netlify gebruikte Brain-observability-modules voortaan als Netlify runtime-impact. `requiresBrainRuntimeAuthenticatedProof` eist afzonderlijk geauthenticeerde tenantbewijsvoering wanneer publicatiebewijs of de Netlify observability-route wijzigt. In de bestaande API komt één niet-gevoelig contractveld `social-publication-proof-v2`; die versie kan na de normale Netlify-release onafhankelijk worden gelezen met dezelfde adminrechten.

De wijziging bevat géén tweede scheduler, nieuwe publisher, credentiaaluitwisseling, afgeschafte kwaliteitscontrole, Netlify-CLI-force of fictieve provider-ID. Alleen een normale branch → Required/CodeQL/Netlify-build → main → gepubliceerde Netlify SHA → geauthenticeerde observability-readback mag LIVE bewijzen.

## Acceptatie

- Exact-head tests, Required, CodeQL en beschermde merge.
- Live Netlify gepubliceerde commit bevat deze wijziging of een bewezen descendant.
- Geauthenticeerd `GET /api/powerhouse-observability`: vereist admin- en tenantidentiteit, publicatiebewijs bevat contract `social-publication-proof-v2` en echte niet-groene kanaalstatussen.
- LinkedIn persoonlijk/Instagram mogen pas groen na echte provider-ID plus onafhankelijke provider-readback.
- ONE BRAIN-learning en bestaande skill/architectuurdocumentatie worden bijgewerkt; geen tweede publicatie-executor.
