---
name: powerhouse-ai-model-advisor
description: Use for AI model comparison, model routing, cost advice, provider governance, data sovereignty, residency, model lifecycle, source freshness, and public AI Modelwijzer changes.
---

# Powerhouse AI Model Advisor

Fingerprint: `powerhouse|ai-model-advisor|goal-cost-governance-revenue-loop|v1`.

## Canonical purpose
Turn a real user goal into a source-backed model choice or multi-model routing strategy while exposing cost, capability, lifecycle, privacy, data residency and sovereignty constraints.

## Canonical surfaces
- Public acquisition surface: `/ai-modelwijzer`
- Browser catalog projection: `data/ai-model-catalog.json`
- Runtime model registry: `public.powerhouse_ai_model_registry`
- Official source watch: `public.powerhouse_ai_model_source_watch`
- Freshness view: `public.powerhouse_ai_model_freshness_v1`
- Lead route: `/api/ai-model-advisor-lead`
- Commercial outcome authority: existing `commercial-lead-ingest` -> Growth Data Hub -> qualified lead/order/revenue learning.

## Required dimensions
Each model record should support:
provider, exact model ID, lifecycle, modalities, context, max output, reasoning, coding, writing, analysis, speed, pricing, cached pricing, batch/flex pricing, tool use, web/search, structured output, fine-tuning, embeddings/OCR/audio/image/video, open weights, self-hosting, deployment choices, data residency, data processing region, retention, training policy, DPA, subprocessors, jurisdiction, security certifications, enterprise controls, EU/EEA suitability, AI Act/GDPR considerations, source URL, verified_at and freshness.

## Fail-closed governance
- UNKNOWN is not GREEN.
- Never infer EU residency, zero retention, no-training, self-hosting or compliance from provider nationality or marketing language.
- A user requirement marked REQUIRED removes or penalizes models whose evidence is missing.
- Prices and lifecycle claims need a current official source.
- Deprecated/retired models remain searchable for migration/comparison but are not recommended by default.

## Recommendation contract
Input: free-text goal + priority + governance constraints + estimated workload.
Output: top-fit models, reasons, trade-offs, estimated workload cost where price is verified, governance caveats, source and verification date.
Do not claim an absolute universal best model. Recommend for the stated workload and constraints.

## Model-routing contract
When one model is not economically or operationally optimal, recommend a bounded stack:
bulk/triage -> standard reasoning -> frontier exception path -> specialist model where applicable.
Cost saving is an estimate unless observed billing evidence exists.

## Coverage and freshness
The registry is designed for all materially available provider models, not a fixed shortlist. Source watchers must detect provider model/pricing/lifecycle changes. New/changed models are CANDIDATE until official-source verification; only then may they become recommendation-eligible.

## SEO / order loop
Search intent -> Modelwijzer -> useful ungated advice -> optional lead capture -> Frisse Blik -> proposal/order -> realized revenue -> Powerhouse learning.
No email gate before initial useful advice. No fake benchmark, fake savings or fake compliance claim.

## Powerhouse writeback
Every material change must update relevant System Map, Brain learning, human change documentation, development ledger, tests and production readback in the same lineage.
