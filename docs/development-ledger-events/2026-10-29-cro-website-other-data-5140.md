# 2026-10-29 — Website CRO data & incident closure event

- **Obligation:** SITE-CRO-OTHER-DATA-20261029
- **Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5141
- **Implementation:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5140
- **Writer:** Existing Powerhouse protected GitHub PR. No parallel scheduler and no direct production write.
- **Observed data:** 707,276 bg_interacties; last 7 days 731 form_submitted all flagged bots; 222,727 growth_events; 7,949 growth_page_daily pageviews in last 30 days with 0 recorded CTAs/leads/orders (not proof of zero real actions).
- **Cause:** fire-and-forget sendBeacon batch is removed before authoritative ACK; 202 degraded ack says ok true even with opgeslagen 0. CRO results scattered, no canonical owner-facing view.
- **Patch:** Data & intelligence → Andere data with admin-only Supabase read model and fail-closed source flags; consented CTA/form-intent bridge into existing growth-event durable queue, same event id on bounded retries.
- **Explicitly open:** raw bg_interacties at-least-once storage, ACK/dedupe and 202 degraded false success remain issue #5141; consent and bot-quality browser verification remain pending. The new bridge only covers commercial events.
- **Regression:** tests/portal-cro-other-data.test.mjs; GitHub Required/CodeQL and authenticated owner/tenant browser readback still required.
- **Impact status:** CODE_STAGED; NOT_MERGED; NOT_LIVE; OUTCOME_NOT_VERIFIED. Record must not be converted to success without exact main→Netlify→browser→Supabase readback.

## 29 oktober — service-role CRO-bewijsprojectie, kandidaat

- **Besluit:** bestaande `powerhouse_cro_conversion_evidence_v1` en `powerhouse_cro_experiment_evidence_v1` read-only toevoegen aan dezelfde beveiligde portal API; de views worden via #5143 aangeleverd, dus zonder toegepaste migratie **UNAVAILABLE**.
- **Bewijsintegriteit:** clientlabels voor `growth_page_daily.won_orders` en `revenue_eur` zijn expliciet **onbevestigd**; `orders_with_recorded_provider_readback_30d` bewijst alleen dat er providerreferenties geregistreerd zijn, geen externe betalingsbevestiging. `paidOrdersIndependentlyVerified` en `realizedRevenueIndependentlyVerifiedEur` blijven `null` totdat externe bronreadback bestaat.
- **Experimenten:** toont cohorten en volwassen treatment/holdout naast minimum per arm; `INSUFFICIENT_MATURED_ASSIGNMENTS` is geen winnaar.
- **Regressie:** `tests/portal-cro-other-data.test.mjs` controleert ontbrekende views, onbewijsbare omzet, bronbeschikbaarheid en gelijklopende read-only API.
- **Afhankelijkheid:** #5143 exact-head Required/CodeQL, merge, Supabase migration ledger/readback vóór #5140 als volledig geproduceerd wordt beschouwd. **Niet live bewezen** in deze schrijfactie.
- **Agentoverdracht:** dezelfde CRO-root-cause en bestaande BRAIN-fingerprint `powerhouse|cro|cta-event-alias-mismatch|20261029`, menselijk document `docs/changes/2026-10-29-cro-website-other-data-5140.md`, ONE BRAIN / Heartbeat; geen tweede scheduler.
