# Innovatieagent — eerste brongebonden controle in bestaande uitvoeringsketen (2026-11-15)

**Oorspronkelijke P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

**Oorspronkelijke innovatiebron:** `powerhouse_optimization_candidate_v1.candidate_id=55bb0754-355b-4940-aaea-aed7123e7e57` (`quality-learning-v1:sales-cycle-legacy-execution-truth-projection-20261029`), oorspronkelijke eigenaar `agent:agent-integration-engineer`, `review_required`. Oorspronkelijke 14 kandidaat-/verplichting-/intake-records blijven hun eigen bronidentiteit behouden.

## Oorzaak en feitelijk bronbewijs

Op 15 november toont de originele Supabase-bron 14 `INNOVATION_DELIVERY` OPEN en 14 `INNOVATION_INTAKE` PLANNED, zonder onafhankelijke consumer-ACK. In de bestaande verkooplus bevat `powerhouse_cycle_events` historische `execution`-events die niet automatisch een werkelijk uitgevoerde `powerhouse_sales_actions`-actie betekenen. Een groene cron of eventtelling is geen bewijs van provider-verzending. De beschermde eerdere correctie https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5109 verandert de writer, maar herclassificeert historische events niet.

## Bounded bronkoppeling binnen dezelfde bestaande beheercockpit

De bestaande beveiligde Netlify `/api/powerhouse-control-plane` roept ná Identity JWT en admin-rolcontrole dezelfde `readPowerhouseIntegrationReadback` aan met `includeSalesExecutionAudit:true`. Het nieuwe server-only leespad gebruikt slechts de bestaande service-role data API en uitsluitend GET: de laatste maximaal 100 `sales_action/execution`-events uit de laatste 7 dagen met exacte provider-Content-Range, vervolgens hun originele `action_id`-rijen, zonder person/company/recipient velden. Een event is *actiebron-ondersteund* als `status=done` en `executed_at` niet na eventtijd +5m ligt; voor provider-send, omzet of causaliteit volgt daaruit niets. In het bestaande adminpaneel staan totale 7d-telling, aantal werkelijk gekoppelde gecontroleerde events, ontbrekende bron, ontbrekende actie en expliciete `FULL_LAST_7D` versus `LATEST_100_ONLY`.

Fail-closed: verkeerde bronhost, ontbrekende API-key, onjuiste exact-count header, ontbrekende/gedupliceerde of ongeldige actie-UUID, out-of-range event, extra provider-rij of HTTP/JSON-fout is `SOURCE_UNAVAILABLE`; ontbrekende acties blijven zichtbare `SOURCE_EXECUTION_GAP`, niet nul of groen. Geen acties, geen schedulers, geen tabel, geen migratie, geen extra agent, geen DB-writes, geen RLS-exceptie en geen persoonlijke informatie naar de browser.

## Test, release en statusgrens

Gerichte tests in de reeds bestaande Required-test `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs` controleren een echte 2-naar-2 identiteitstoewijzing met één niet-uitgevoerde bron, ontbrekende telling, ongeldige UUID, een correcte 0-bron, PII/secret-minimalisatie en dat admin-authorisatie vóór ieder server-read plaatsvindt.

**Dit is nog géén afgeronde autonome innovatie.** Tot Required, CodeQL, beschermde merge, Netlify exact-SHA en de eerste geauthenticeerde productie-readback zijn bevestigd is het een broncodewijziging. De extra meting bewijst nooit onafhankelijk een originele consumer-ACK, operationele code-uitvoering, volledige 7-daagse audit bij sample-cutoff of daadwerkelijk betaalde omzet. Daarna moet de originele engineer de specifieke bronrevisie veilig claimen, de uitkomst vergelijken met eerdere observaties en pas na onafhankelijke ONE BRAIN/Heartbeat-effectmeting de kandidaat afronden. Rollback: via de bestaande protected release naar de vorige cockpit-revisie; historische bronnen blijven onveranderd.
