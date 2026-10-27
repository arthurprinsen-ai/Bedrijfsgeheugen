# 2026-09-30 — AI Modelwijzer Falcon provider coverage

Obligation: `ai-modelwijzer-falcon-expansion-2026-09-30`.

## Signal
The live Modelwijzer had 103 model records across 10 providers, but no TII/Falcon family. That contradicted the completeness contract for open-weight, self-host, private-cloud and sovereign deployment choices.

## Action
- add TII/Falcon as provider family 11;
- add Falcon H1 instruction variants, Falcon H1R and Falcon OCR decision records;
- add customer-controlled self-host/customer-cloud/on-prem governance;
- add official TII + official TII Hugging Face source authority;
- bind Falcon coverage into the AI Model Intelligence skill and canonical System Map;
- extend regression assertions so Falcon cannot silently disappear.

## Governance
Self-host capability is represented as a deployment-path property. It does not mean every deployment is physically in the EU. Managed hosting remains provider-dependent until a concrete hosting path is selected.

## Evidence
- https://www.tii.ae/news/middle-easts-leading-ai-powerhouse-tii-launches-two-new-ai-models-falcon-arabic-first-arabic
- https://huggingface.co/collections/tiiuae/falcon-h1
- `tests/brain-ai-model-intelligence-v1.test.mjs`
- PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/3417
