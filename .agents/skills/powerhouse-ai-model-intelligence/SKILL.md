---
name: powerhouse-ai-model-intelligence
description: Use whenever Powerhouse compares, recommends, prices, filters or publishes information about AI models, providers, model routing, data residency, governance or sovereignty.
---

# Powerhouse AI Model Intelligence

Fingerprint: `powerhouse|ai-model-intelligence|goal-cost-governance-sovereignty|v1`.

## Canonical authority
- Catalog: `data/ai-model-catalog-v1.json`
- Runtime policy: `config/powerhouse-ai-model-intelligence-v1.json`
- Public advisor: `/ai-modelwijzer`
- Commercial capture: `/api/ai-modelwijzer-lead`
- Outcome loop: existing Powerhouse qualified-lead -> order -> realized revenue lineage.

## Decision contract
Never claim one globally best model. Start from the user's job-to-be-done and hard constraints. Score at minimum capability fit, expected task cost, latency, context, lifecycle status, modalities, governance, storage residency, inference residency, provider jurisdiction, open weights/self-hosting and deployment path. Explain trade-offs.

Data residency is not data sovereignty. Always distinguish storage location, inference location, legal/provider jurisdiction, subprocessors and whether the workload can be run under the customer's own cloud/on-prem boundary.

Prices and lifecycle state are perishable evidence. Official provider documentation is primary. If evidence is stale or unknown, mark it unknown rather than infer it.

## Revenue contract
The advisor is value-first and ungated. Give useful recommendations before asking for details. Commercial progression may then offer a saved recommendation, architecture review, Bedrijfslek/Frisse Blik or implementation route. Optimize to qualified leads, orders and realized revenue, never raw clicks.

## Powerhouse closure
Material changes require System Map, Brain learning, human change documentation, regression coverage, protected delivery and production readback.


## V2 completeness contract — 30 september 2026
Fingerprint: `powerhouse|ai-model-intelligence|broad-specialist-coverage|v2`.

The canonical catalog is not a shortlist of chatbots. It must cover decision-relevant model classes across:
- frontier/general reasoning;
- economy/high-volume;
- coding;
- image generation/editing;
- realtime/voice;
- transcription and TTS;
- OCR/document AI;
- embeddings/RAG/reranking;
- moderation/safety;
- video;
- open-weight/self-host/private deployments.

Every model record must expose an official provider source, verification date, explicit limitations/less-suitable use cases, deployment path and governance fields for storage residency, inference residency, training, retention, zero-retention and subprocessors. Unknown remains UNKNOWN.

The advisor must use specialist-intent gating: a specialist model may not outrank a general model merely because of speed/cost unless the user's goal actually matches that specialist task.

Public filters must include at least provider, tier, governance profile, modality and task/use case. The public page must display both strengths and limitations.

Coverage is continuously expanded from official sources. “Complete” means the broadest maintained decision catalog with explicit freshness/provenance, not a frozen claim that every model in existence is known forever.


## Provider/deployment governance authority
Fingerprint: `powerhouse|ai-model-governance|deployment-path-not-provider-label|v1`.

Canonical source: `data/ai-provider-governance-v1.json`.

Model selection for sensitive data MUST evaluate deployment-path evidence separately from model quality:
- storage residency;
- inference residency;
- provider jurisdiction;
- customer-data training policy;
- default retention;
- zero-data-retention availability;
- customer-managed keys;
- private networking;
- self-host/customer-cloud availability;
- sovereignty level.

A provider being European, a model being open-weight, or storage being in the EU never proves EU inference or full sovereignty. The public advisor must surface the matching deployment path and official governance source when available.


## Production build invariant — 30 september 2026
Fingerprint: `powerhouse|ai-modelwijzer|interactive-i18n-ci|v1`.

The public Modelwijzer is an interactive application and MUST remain in the canonical V18 builder's `EIGEN_WERKING` set. It may not be flattened into ordinary content-page composition.

Every user-visible Dutch string introduced on `/ai-modelwijzer` must have a deterministic static-English cache entry before protected promotion. Production/deploy-preview builds run with `STATIC_I18N_REQUIRE_CACHE=1`; a missing translation is a release blocker, not a reason to disable English generation.

`tests/ai-model-advisor-v1.test.mjs` and `tests/brain-ai-modelwijzer-production-build-v1.test.mjs` are required website-lane regressions. A committed Modelwijzer test that is not referenced by CI is a control failure.


## SEO cluster visibility invariant
All public AI-model provider/comparison pages must include a visible canonical Bedrijfsgeheugen header/navigation element on phone, tablet and desktop. Standalone SEO pages without a header are a release blocker even when their content, canonicals and Modelwijzer links are correct.

Every indexable AI Modelwijzer SEO intent route must expose a visible canonical Bedrijfsgeheugen header and pass the shared phone/tablet/desktop visibility gate. Standalone SEO content without the global header is not production-ready.
