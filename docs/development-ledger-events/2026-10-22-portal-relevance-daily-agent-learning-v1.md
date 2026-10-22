# Append-only development ledger — 2026-10-22 — Portal Relevantie & dagelijkse agent-learning

Fingerprint: `powerhouse|agent-incident-relevance-daily-evolution|20261022-v1`  
Obligation-ID: `powerhouse|agent-incident-relevance-daily-evolution|20261022-v1`  
Writer: **existing** [PR #4673](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4673). Status: CANDIDATE; production NOT PROVEN.

## Scope en canonieke herkomst
- Behoud canonieke Universal Closed-loop Learning en Brain failure registry. Geen tweede database, scheduler of learning store.
- Reuse existing Portal V2 `learning-writeback` as **Relevantie & verbeteringen**, bounded by authenticated tenant projection `portal.runtime.learning.items` and `brain-operating-loop` source authority.
- Gate incidentpreflight, canonical writeback and evidence-backed daily improvements. Never infer `PROVEN` from a healthy badge without runtime proof or from missing tenant data.
- Regression: `tests/brain-universal-closed-loop-learning.test.mjs`, `portal-v2/tests/relevance-learning-closed-loop.test.mjs`; validator: `scripts/brain/validate-universal-closed-loop-learning.mjs`.

## Correctieve samenvoeging met reeds gemergede dagelijkse leerisolatie
- PR #4666 merged with protected Required 39814996211 and CodeQL 39814996035. The original daily self-evolution workflow now has independent `improve` and `model-freshness` jobs and `if: always()` checkpoint, without a parallel scheduler.
- PR #4673 independently edited the same `.github/workflows/powerhouse-daily-self-evolution.yml`, so its old workflow snapshot risked losing #4666's continuous learning protection.
- Reconciled onto protected main `6abf3e9de1fe6a0552bcd1f942cd69e621518a77` as a two-parent merge on the same owner branch. Kept `model-freshness` and terminal checkpoint, and inserted the mandatory incident/portal regression into the existing `improve` job before self evolution. No new daily schedule.

## Reëel geobserveerde toelatingsfouten en preventie
1. Initial #4673 required run 39813937625 rejected absent machine metadata; corrected in the original PR, not via a new writer.
2. Required run [39818082206](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39818082206) rejected `LEARNING_FAILURE_CLASS_REQUIRED` because the candidate learning file lacked machine `compiler.failure_class` and executable evaluation; corrected in the same learning record with `compiler.failure_class=AGENT_LEARNING_CONTRACT`, `scope=PORTAL`, `evaluation.historical_replay=[tests/brain-universal-closed-loop-learning.test.mjs]`.
3. Required run [39818417996](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39818417996) succeeded at learning canonicalization but rejected `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger`. Root cause: the material portal change carried a human change summary but omitted its independently required development-ledger entry. This file repairs that omission **without weakening admission**.

## Voorkomen, hergebruik en testbewijs
- Before any material future portal/agent PR, require obligation ownership, `compiler.failure_class`, exact executable brain replay, `brain/learning` evidence, human change docs and an append-only `docs/development-ledger-events` entry.
- Verify protected exact-head Required CI and CodeQL, regression tests, merge to current main, Netlify production identity, and actual authenticated tenant Portal V2 data readback. A successful code test is not yet an authenticated production proof.
- Existing fingerprint `powerhouse|agent-incident-relevance-daily-evolution|20261022-v1` remains CANDIDATE until independent runtime evidence. No external send, paid preview branch, duplicate scheduler or false LIVE_PROVEN claim.
