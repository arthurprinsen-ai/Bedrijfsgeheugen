# Trusted Advisor customer truth — source-evidence development event — 2026-11-12

- **Fingerprint:** `powerhouse|trust|unsupported-claims-and-outcome-status|20261112-v1`
- **Original obligation:** `portal|trusted-advisor-evidence-integrity|20261112-v1`; original Portal V2 assurance + CMS/website editorial owner
- **Original incident state:** source observations verified in main branch; proposed repair CANDIDATE; not an independently verified live customer result
- **Learning:** `brain/learning/2026-11-12-trusted-advisor-customer-truth-v1.json`
- **Human-readable documentation:** `docs/changes/2026-11-12-trusted-advisor-customer-truth.md`
- **PR:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5678
- **Scope:** existing portal assurance, primary site pages, existing mobile menu, original editorial skill + policy, tests/docs; no second scheduler or provider

## Evidence and root cause
The existing navigation promised a seven-question free scan whereas the actual scan page says twelve questions and three minutes. Contact/hidden finish messages promised emailed reports despite the anonymous on-screen result. Four main website pages asserted general deployment within two weeks. More critically, the Portal V2 trust UI had allowed `healthy !== false` and `status=ok` to imply a healthy source or independently verified outcome. These are direct source-code observations, not measured user harm.

## Repair / prevention
Retain original application and its writer lease. Align copy with the actual free scan, differentiate paid Frisse Blik, remove unconditional universal delivery promise and reduce self-appointed badges. Require explicit source health and individual outcome proof references before verified status. Carry the invariants in the original policy/skill; regression coverage checks both source failure and site/customer journey copy drift.

## Evidence due
- GitHub Required + BRAIN + CodeQL exact-head checks
- protected merge and Netlify exact-SHA production readback
- browser-level check on actual website and authenticated Portal V2 tenant
- actual independent proof metadata, not a generic process-success flag
- original ONE BRAIN consumer processed ACK and consent-safe subsequent conversion measurements

**Release and measured trust status: NOT_PROVEN.** Do not close on a candidate commit or claim conversion/retention uplift without actual outcomes.

## Specialist-agent en originele overdracht — aanvullend bronbewijs
De bestaande `agent-governance-ai-act` in `platform/agents/agent-team.mjs` draagt de rol `trusted-advisor-specialist` binnen de originele set van 14 agents, zonder eigen planner, publicatie- of schrijfrechten. De originele redactieraad gebruikt dezelfde rol voor website/social/blog/e-mail en de bestaande CMS-gate behoudt het publicatierecht. Het `brain/policies/trusted-advisor-assurance-v1.json`-contract vereist tenant, source revision, obligation, eigenaar, idempotency key, daadwerkelijke consumer **processed** ACK en onafhankelijke uitkomstreferentie in dezelfde lineage. Deze registratie is **broncodeborging**, geen aangetoond runtime-ACK. Test: `tests/brain-trusted-advisor-agent-one-loop-20261112.test.mjs`. Volgende verificatie: exact PR-head Required/BRAIN/CodeQL, beschermde merge, productie-SHA, provider/browserreadback en originele ONE BRAIN-consumerstatus. Bij ontbreken: zelfde fingerprint heropenen; geen tweede executor.

## Agent Fabric preflight: bewezen en herstelde fout
De verplichte CI liet `agent-fabric-team-memory`, `brain-one-loop-agent-skill-binding`, `brain-original-all-loop-cro-handoff-continuity` en `brain-portal-cro-autonomous-decision-handoff` falen doordat de eerste kandidaat een vijftiende zelfstandige agent-ID toevoegde. Dit zou de oorspronkelijke autoriteits- en overdrachtscontracten verzwakken. De extra ID is verwijderd; de Trusted Advisor-functie is ondergebracht bij bestaande `agent-governance-ai-act` plus het originele redactieraadrolprofiel, met 14 geregistreerde agents. De oorspronkelijke vier guards blijven ongewijzigd; regressie test de 14-agentinvariant. Status: kandidaatcorrectie, nieuwe exacte CI en productie-readback noodzakelijk.

## Bewijsafhankelijkheid Supabase-providerlock — 12 november 2026
Tijdens de hernieuwde protected PR-merge-preview faalden zes originele migration-lock-regressies op één meer uitvoerbaar SQL-bestand dan de gecontroleerde lock. Onafhankelijke Supabase-productieopvraging voor het oorspronkelijke project `adhjwmvyoixzjtmiroln` bevestigde **835** werkelijk toegepaste migraties tegenover **834** in `supabase/migration-history.lock.json`; alle eerste 834 versies én namen waren exact gelijk. Nieuwste providerrecord: `20261112211000_original_skipped_provider_reference_readback_handoff_v1`. De live functie `public.powerhouse_content_handoff_receipts_v1(timestamptz)` bestaat en bevat de branch `OVERDUE_PROVIDER_READBACK`. Alleen het oorspronkelijke lockbestand is append-only bijgewerkt met deze geverifieerde provider-identiteit, niet de providerhistorie of migratiecode. Oorzaak: eerdere original-owner migratie was al toegepast, maar lockreadback bleef administratief achter. Preventie: elke originele migration GitOps-release verplicht provider-history readback, migratie-lockpariteit, bestaande testgates en consumerbewijs voordat afhankelijke PR's kunnen mergen. Deze broncorrectie is geen bewijs van zelfstandig uitgevoerde Trusted Advisor-klantadviezen; beschermde checks en exacte Netlify SHA blijven verschuldigd.
