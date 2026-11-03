# Bedrijfsgeheugen Powerhouse — agentbewijs, datakwaliteit en continue verbetering

**Datum:** 29 oktober 2026 · **Status:** POLICY + PREFLIGHT CANDIDATE; runtime-effect, release en portaal-readback ONBEWEZEN.

## Betekenis voor mensen
Alle bestaande agents werken voor hetzelfde bedrijfsdoel: bezoekers aantrekken, relevante contacten helpen, gekwalificeerde leads en orders realiseren en van echte resultaten leren. Iedere belangrijke beslissing, wijziging, fout of verbetering moet herleidbaar zijn tot wie/wat handelde, waarom, welke bron werd gebruikt, wat er is veranderd, hoe het resultaat werd geverifieerd en wat de volgende agent daarvan leert.

Een groene GitHub-build betekent niet automatisch dat de website live is, de agent iets heeft uitgevoerd of dat een verkoop is gerealiseerd.

## Bestaande architectuur (geen tweede systeem)
Powerhouse/Heartbeat **bestaande scheduler** → bestaande **exclusieve writer** → `public.powerhouse_decision_cycles` / `public.powerhouse_cycle_events` → ONE BRAIN (`public.brain_records`, `public.brain_failure_registry`) → bestaande observatie- en klantportaalprojecties → verified outcome → bruikbare nieuwe kennis/skill/guard.

Geen nieuwe scheduler, publisher, knowledge store, tweede agentbrein of alternatieve externe publicatieroute.

## Verplichte agentstappen
1. **Lees actuele waarheid**: tenant, actuele source, provideridentiteit, open obligation, bestaande hypotheses, laatst bewezen release en gerelateerde fouten.
2. **Maak de actie meetbaar**: schrijf een correlatie-/obligation-ID, eventtijd, actor-kind en (bij echte agents) expliciete agent-ID + skillversie weg. SQL-materializers worden **nooit** als echte agentacties geteld.
3. **Controleer data**: source, herkomst, versheid, kwaliteit, schema, toestemming, tenant-scheiding, ontbrekende records en conflict. **UNKNOWN ≠ ZERO**.
4. **Repareer een datagat**: veilige refetch/reconciliatie; als er geen bron is: één gededupliceerde instrumentation-obligation met eigenaar en bewaakte implementatie. Geen fictieve data, tokens of providerbewijs.
5. **Neem een datagedreven beslissing**: hypothese, prioriteit, nulmeting, verwachte orders/omzet, risico, kosten, afhankelijkheden en meetmethode.
6. **Implementeer veilig**: via bestaande exclusieve writer en beschermde GitHub-/Supabase-/Netlify-/providerpaden. Bij uitgaande berichten blijven consent, identiteits- en duplicate-gates verplicht.
7. **Verifieer onafhankelijk**: test, regressietest, SHA, provider-ID of productie-readback, resultaat en causale onzekerheid. Voor-/nameting mag 'UNKNOWN' zijn wanneer werkelijk onbekend, maar is dan geen beweesde uplift.
8. **Borg**: update het bestaande Brain-/incidentregister, skill of regression guard, menselijke handleiding, canonieke systeemkaart en portalprojectie; controleer de readback.
9. **Leer en prioriteer opnieuw**: meet effect op bezoekers, conversie, gekwalificeerde lead, offerte, order, betaalde omzet, kwaliteit, latentie en kosten. Geen optimalisatie uitsluitend op impressies of likes.

## Dashboard / Portal V2
Gebruik de **bestaande observability-module en beveiligde tenant-scoped API**. Toon: tijd, actor-kind, agent en skill (indien bewezen), bron + freshness, beslissing, status, change/commit/providerevidence, foutfingerprint, oorzaak, uitgevoerde fix, test en onafhankelijke readback, menselijke uitleg, voor-/nameting, attributie, waarde, open data-gaten, eigenaar en volgende actie. Markeer onbekend onafhankelijk van nul. Vermijd ruwe PII/tokens; RLS en tenant-isolatie zijn verplicht.

## Toe te voegen intelligentie binnen de bestaande agents
- Data Gap Hunter: bron- en meetdekking, conflict/freshness, veilige instrumentatie.
- Root Cause Intelligence: clustering van herhalende incidenten en voorkomen van regressies.
- Predictive Recovery: onderbouwde afwijkingsdetectie met benchmark, confidence en false-positive-rate.
- Experiment Intelligence: vergelijkbare baseline, cohort, guardrails, impact en rollback.
- Revenue Attribution Intelligence: content → website → lead → meeting → offerte → bewezen order/omzet.
- Knowledge Evolution: alleen geverifieerde lessons → Brain, skill, test/guard en systeemkaart.
- Architecture Drift Guard: vergelijkt code, runtime, handboek, portal en providerroute.
- Improvement Prioritizer: verwachte incrementele orders/omzet × bewijszekerheid tegenover risico, uren en kosten.

## Huidig gemeten gat (Supabase 29 oktober 2026)
24-uurs telling in `public.powerhouse_cycle_events`: **1.587** events; **0** met `payload.agent_id`, **0** met `payload.skill_version`, **0** met beide `payload.before_metric` en `payload.after_metric`. Dit zijn voornamelijk SQL-geproduceerde cyclusgebeurtenissen, géén bewijs van 1.587 autonome agentacties of 1.587 mislukkingen. Geen retroactieve fictieve agent-identiteit.

## Open operationele acceptatie
Deze change **versterkt policy en preflight** maar implementeert niet automatisch runtime-instrumentatie. Volgende same-lineage stappen:
- instrumenteer **bestaande** agent-uitvoerders met actor-kind, agent-ID, skillversie, bron/evidence, voor-/nameting of expliciete onbekendstatus;
- bewijs idempotente opslag/ack, faalmodus en strikte tenantgrenzen;
- laat in het **bestaande** portaal onafhankelijke echte runtimegegevens zien en verifieer beheerder + twee tenants;
- meet dekking en gerealiseerde commerciële verbetering, herhaal datagedreven;
- toets Required, Brain, CodeQL, beschermde merge, Netlify, exacte productie-SHA en geauthenticeerde browser-readback;
- update dit document, bestaande Notion-bronnen en System Map pas als de relevante bewijslaag werkelijk klopt.

**Releasewaarheid:** 'config actief', 'runtime schrijft', 'portaal live' en 'zakelijk resultaat bewezen' zijn vier verschillende claims.
