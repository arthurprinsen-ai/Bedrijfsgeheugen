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


## Falcon/TII coverage contract — 30 september 2026
Fingerprint: `powerhouse|ai-model-intelligence|falcon-selfhost-sovereignty|v1`.

TII/Falcon is a required open-weight/self-host provider family in the canonical model catalog. Falcon must never disappear from model discovery merely because it has no single canonical managed-API price.

For Falcon and comparable open-weight families:
- represent self-host, customer-cloud and on-prem as deployment paths rather than pretending one provider-hosted API is canonical;
- customer-controlled storage/inference only means the customer can choose and operate that boundary; it does not imply that every Falcon deployment runs in the EU;
- managed-hosting price, retention, subprocessors and residency remain provider-dependent until an official hosting path is selected;
- official TII and official TII Hugging Face sources are authoritative for family/model existence;
- public recommendations must explain that sovereignty comes from the selected deployment path, not from the model name or provider nationality.

Regression coverage must keep at least one current Falcon reasoning/general model and one specialist Falcon model represented, with explicit source and governance evidence.


## V3 novice outcome-first advisor contract — 30 september 2026
Fingerprint: `powerhouse|ai-model-intelligence|novice-outcome-volume-risk|v3`.

The public Modelwijzer must work for a visitor who does not know model names, tokens, context windows, APIs or hosting terminology.

The primary path MUST start with ordinary business questions, in this order:
- desired business outcome / job-to-be-done;
- one-off, periodic, daily or continuous use;
- number of users/employees involved;
- approximate workload/volume, with a safe estimate option;
- data sensitivity (public, internal, personal/customer, highly confidential);
- consequence if the AI is wrong;
- interaction/deployment pattern (chat, office work, API, agents/workflow);
- priority (quality, cost, speed, privacy/control, balanced);
- approximate monthly budget;
- cloud/EU/customer-controlled preference.

Technical token and governance controls remain available as an advanced path, never as the first hurdle.

The advisor translates simple answers into an explicit workload profile and shows that profile back to the visitor before/with the recommendation. Recommendations must explain in plain language:
1. what to start with;
2. why it fits the user's goal and scale;
3. indicative monthly workload/cost;
4. when to use a cheaper fallback versus a stronger model;
5. what human control is needed when errors have high impact;
6. what data/privacy controls must be checked.

Employee count and cadence are decision inputs, not vanity fields: they influence workload scale and therefore cost/throughput trade-offs. High-impact use cases increase the weight of quality/reasoning and require human approval guidance. Personal/customer data increases privacy/residency weighting. Highly confidential data increases customer-controlled/self-host weighting.

The Modelwijzer must never assume a novice knows what they need. “Weet ik niet / adviseer mij” is a valid answer and must still produce a useful, explainable recommendation.
