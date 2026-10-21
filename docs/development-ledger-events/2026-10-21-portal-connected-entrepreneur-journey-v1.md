# 2026-10-21 — verbonden ondernemersreis — kandidaat en verplicht bewijs

- **Fingerprint:** `portal|eight-outcomes|connected-entrepreneur-journey|v1`
- **Oorspronkelijke signalen:** scan/ondernemersdoel, bestaande cockpit en Winstnavigator, router, Brain/Powerhouse/Heartbeat en contextuele visualisaties waren afzonderlijke UI-componenten. De Winstnavigator kwam niet voor in de mount van `portal-v2/app.js`.
- **Hoofdoorzaak:** ontbrekende UI-compositie, niet een nieuwe tenant- of modelautoriteit. Niet alle bron- en effectverwerkingsbewijzen waren zichtbaar in één klantenreis.
- **Wijziging:** maak authentieke brongebonden journey-projectie, mount bestaande Winstnavigator, start op gekozen doel, toets gedrag bij onbekende metrics, luister uitsluitend op bestaande impact- en Brain-ACK-events, toon afhankelijkheid zonder fictieve berekening, bied hulp op geregistreerde pagina's.
- **Bewijs en regressie:** `tests/brain-portal-entrepreneur-goal-home-v1.test.mjs` importeert `portal-v2/tests/entrepreneur-journey.test.mjs`; bestaande scan-claim/revalidation/owner/winstnavigator-tests blijven leidend.
- **Beveiligingsgrens:** guest/demo geen tenantkaart; veranderende principal wist gebeurtenisstatus; beheerdata uit Notion/GitHub/Netlify niet in browserside bedrijfswaarheid; Composio alleen bestaande toestemming en providerbewijs.
- **Effecttypen:** interface-afhankelijkheid ≠ feitelijke herberekening; Brain-ACK ≠ uitvoering; statische Notion-tekst ≠ live klantdata; statistische scenario-extrapolatie ≠ gevalideerd financieel resultaat.
- **Status:** wijzigingen uitsluitend op een beschermde branch; Required/CodeQL, exact-HEAD release, twee echte ingelogde klanten, 51-veldpariteit en provider outcomereadback nog verifiëren. Laat #4215/#4547 open zolang dat ontbreekt.
- **Rollback:** revert uitsluitend deze frontendintegratie; oorspronkelijke scanclaim, domainState, cockpit, Brain, scheduler, jobs, Supabase schema en overige portalmodules blijven behouden.
- **Next-step/no-repeat:** herstel foutieve regressies in dezelfde lineage; geen tweede portaal of ongeautoriseerde provideractie maken om een test rood te verbergen.

## 2026-10-21 — TERMINAL RELEASE TRUTH RECONCILIATION

- **Obligation:** [#4585](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4585). **Fingerprint:** `portal|eight-outcomes|connected-entrepreneur-journey|provider-truth-reconciliation|v1`.
- **Provider evidence:** protected [PR #4588](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4588) merged 09:26:38Z; exact main `20abd485e7956bf8f1aa541a52076533269e4569`; Netlify `6ad88550dd76a312a37b77fc` ready/current/production/main exact commit, 09:28:54.780Z.
- **Cause:** immutable provider readback occurred after the original protected PR merged. Existing System Map and Brain learning still carried `CANDIDATE_PROTECTED_DELIVERY`.
- **Repair:** project `LIVE_PROVEN_PROVIDER_TRUTH` to System Map and Brain-learning with exact SHA, Netlify deployment and publication instant while keeping `PENDING_TWO_REAL_AUTHENTICATED_TENANT_JOURNEYS` independent.
- **Regression/control:** preserve old Required, CodeQL, material writeback and explanation-inventory gates; postrelease evidence-only PR does not silently update production code or affect DB/RLS/scheduler.
- **Explicit unverified:** independent tenant A/B isolation and re-login, connector execution provider receipts, Heartbeat end-to-end, causal realized finance and #4215/#4547 all-pages acceptance. The release alone cannot close these obligations.
- **Recovery rule:** terminal delivery truth != post-action customer outcome. Never demote externally verified deploy evidence due to missing browser access, and never upgrade customer E2E from provider deployment success.

## 2026-10-21 — GERichte inhoudswaarheidsreparatie
- **Signaal:** bestaande Bedrijfslek-overzichtkaart kon ontbrekende scan-score als `0/100` tonen, ondanks geverifieerde identiteit; de nieuwe homepage markeerde diezelfde input terecht onbekend.
- **Oorzaak:** JavaScript `Number(null)===0` en `Number('')===0` in de oude renderfunctie.
- **Herstel:** expliciete aanwezigheidstoets vóór numerieke conversie in `portal-v2/modules/overview.js`, behoud echte score 0; regressie voor `undefined`, `null`, lege/gestripte tekst en expliciete nul.
- **Geen alternatief:** geen fictieve bronwaarde in Supabase schrijven, geen scanclaim ongevraagd autoriseren, geen versoepeling van RLS of CI; behoud oorspronkelijke acht-resultaten-lineage en eind-to-end acceptatie onder #4215/#4547/#4585.
- **Releasevereisten:** semantic learning, exact-head Required/CodeQL en exacte Netlify-productie-readback; broninventory-contenthash synchroniseren met gewijzigde V2.

## 2026-10-21 — aanvullende RECOVERY: principal-bound Brain runtime

- **Fingerprint:** `portal|eight-outcomes|principal-bound-live-runtime|v1`.
- **Signal:** uit `/api/brain-operating-loop` succesvol geladen actuele runtime is afgeleid (niet opgeslagen) in `domainState`, maar het geïntegreerde ondernemersjourney-model leest alleen de server-state-client snapshot; een geldige observatie werd daardoor niet in de homepage gebruikt.
- **Root cause:** geen principal-bound projectiebrug van vluchtige geauthenticeerde Brain-runtime naar de nieuwe owner UI.
- **Herstel:** `app.js` leest huidige sessie vóór runtime binding, bewaart uitsluitend tijdelijke projectie onder principal, verwijdert die bij accountwissel, triggert een payload-vrij re-render event, en geeft deze alleen via beveiligde `getTenantRuntime` callback door aan homepage en paginagids.
- **Test:** `portal-v2/tests/entrepreneur-journey.test.mjs` controleert verse Brain-observaties, oude observaties, gast/demo-privacy, andere providerbron en frontend-tenantboundary. Bestaande root replay loopt mee.
- **Rollback:** draai uitsluitend de frontendprojectie terug; de oorspronkelijke geautoriseerde Brain-bridge en Supabase-write blijven intact. Geen nieuwe scheduler of providercredentials.
- **Vervolgacceptatie:** alleen current exact-head Required+CodeQL en Netlify-deploy leveren releasebewijs; twee echte aparte klantaccounts, connector-uitvoeringen en financiële forecasts blijven onafhankelijk ONBEWEZEN.

## 2026-10-21 — terminal provider-proof reconciliation voor principal-bound live runtime

- **Fix lineage:** `portal|eight-outcomes|principal-bound-live-runtime|v1`; PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4599.
- **Build en release:** protected candidate checks Required/Portal/Backend/Netlify/CodeQL SUCCESS; main `dafece9841bcc248f455f0b9beb2520ac13b18fa`.
- **Netlify provider current deploy:** `6ad910c695b04087a1c90a26`, `state=ready`, `context=production`, `branch=main`, dezelfde exact commit, gepubliceerd `2026-10-21T19:23:50.367Z`.
- **Borging:** System Map en bestaande Brain-learning worden geprojecteerd naar `LIVE_PROVEN_PROVIDER_TRUTH`; niet als echte klantuitvoeringsacceptatie of bewezen financiële voorspelling.
- **Onafhankelijk open:** twee geauthenticeerde klanten, account A/B isolatie, oorspronkelijke scan→Brain ACK→gevalideerde forecast en echte provider-outcome. Geen onterechte groenstatus en geen scheduler/provider/OAuth-workaround.
