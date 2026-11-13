# 2026-11-13 — Eén gesloten Powerhouse-keten: terminale ONE BRAIN-bewijspoort

Original incidents: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198), [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215). The original runtime remains `powerhouse-runtime-scheduler-mux-v1`, cron #171, `powerhouse_content_handoff_receipts_v1`; no second runner, queue, publisher, checker scheduler or truth source.

## Aangetoonde aanleiding

On 13 Nov read-only provider SQL found the original `CONTENT_HANDOFF` source and consumer already pass `tenant_id`, exact UTC microsecond `source_revision`, source key, deterministic correlation and `consumer_ack`; 82 historical `content:*` CANCELLED rows all have matching source/revision/correlation/owner and original no-publish decision. The database previously lacked a **separate** constraint on the final `brain_obligations` transition to CANCELLED/FULFILLED. This is a defense-in-depth gap, **not** proof that the 82 cancellations were wrong.

## Geïmplementeerd op kandidaat-branch

One new migration adds an INVOKER-only BEFORE INSERT/UPDATE trigger to the **existing** `public.brain_obligations`, restricted to original `CONTENT_HANDOFF` `content:blog`, `content:instagram`, `content:linkedin_company`, `content:linkedin_personal` and terminal states. All normal OPEN/WAIT/OVERDUE work and unrelated obligations continue unaffected. It reads the existing original `content_publication_obligations` row, verifies exact tenant/source key/UTC revision/correlation/payload identity, and requires an accepted consumer receipt with matching stage, source status and owner.

- **CANCELLED** requires original explicit `SKIPPED / NO_PUBLISH` with dated, coded active veto, accepted no-publish consumer and **no possible provider side effect**. A skipped post with external reference can never be silently considered cancelled.
- **FULFILLED** requires original `PROVEN_NEXT_EXPERIMENT_HANDOFF`, authenticated provider publication, independent metric and analysis receipts, and a later actually proven experiment; blog exact Netlify/HTTP evidence and social provider-ID/account proof stay separate.
- Missing, stale or contradictory proof raises PostgreSQL check violation `23514`. The original writer keeps the obligation OPEN, repairs its existing source/ACK, and retries only through the canonical reconciliation route. Never resolve failures by skipping, making synthetic metrics, ignoring policy, republishing on unknown provider result or changing statuses manually.
- Existing 14 fulfilled `social-learning:*` aliases, email-action handoffs, scheduled future work and old historical records are not rewritten. The function creates no network side effect and does not grant browser/client access.

## Acceptance and operational handoff

1. Native hosted Supabase proposed migration applies cleanly on preview; exact-head Required/BRAIN/CodeQL and current-main integrity pass.
2. Protected merge through existing GitHub owner; original GitOps migrates the schema **once**, no manual production SQL replay. Verify provider schema migration history and `pg_get_triggerdef` plus function source/ACL.
3. Run original #171 naturally. Confirm new source revisions and accepted consumer ACKs, no regression to existing 82 historical NO_PUBLISH rows; verify no terminal transition without the required proof and no duplicate provider side effect.
4. Reconcile remaining current OPEN obligations by due stage using original owners and independent provider receipts. Fix any newly exposed failures without bypassing the guard.
5. Add regression/failure evidence to the existing ONE BRAIN register and next safe original CRO learning. No invented conversions or sales.

`tests/brain-original-one-chain-terminal-proof-20261113.test.mjs` enforces source-level regression. `brain/learning/2026-11-13-original-one-chain-terminal-proof.json` retains cause, prevention and tests.

**State at commit:** source implemented as PR candidate only; production enforcement is NOT VERIFIED until step 2–3. One trigger does not prove that all 15 loops are green or that every historical obligation has finished.

## Preventie — unieke Supabase-migratieversie

De bronrelease voor de originele terminal-state guard gebruikt `20261113083000`, niet `20261113082500`: dat eerdere versienummer is al geclaimd door de afzonderlijke, oorspronkelijke geannuleerde social-learning bron-ACK in #5721. Alleen de bestaande originele GitOps-owner mag na exact-head Required, CodeQL, native Supabase-preview en beschermde merge de migraties **opeenvolgend** toepassen. Een tijdstempelbotsing is een `MIGRATION_VERSION_COLLISION`, nooit een reden om één SQL-bestand als een ander te registreren of tests over te slaan. Eerst controle van de provider-toegepaste versies; pas daarna de bestaande bron-lock bijwerken en de oorspronkelijke BRAIN-consumer-ACK controleren.

## 2026-11-13 — originele provider-migratiebron 842 en volgordelijke vrijgave

De afzonderlijke originele geannuleerde social-learningbron is via beschermde PR #5721 gemerged op `af0095e26a09e90548f236528a6769fc5f94df0f`. Onafhankelijke Supabase-provider-readback `2026-11-13T08:42:03.264335Z` bevestigt **842 toegepaste / 842 unieke** migraties, laatst `20261113082500_original_cancelled_social_learning_source_ack_v1`. De originele bron-lock had nog 841 regels. Dezelfde originele GitOps-autoriteit corrigeert uitsluitend die daadwerkelijk toegepaste 842e identiteit; geen heruitvoering van SQL of toegevoegde providerwriter. De terminale bewakingsfunctie met aparte `20261113083000` is op dit moment **alleen kandidaat**; niet als toegepast of live registreren voordat native Supabase preview, beschermde merge en echte productiereadback zijn geslaagd. Vereiste preventie: `MIGRATION_VERSION_COLLISION` en `SOURCE_LOCK_DRIFT` blijven fail-closed.
