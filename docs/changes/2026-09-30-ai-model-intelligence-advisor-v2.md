# AI Modelwijzer v2 — completeness, specialist models and governance detail

Datum: 30 september 2026

## Uitbreiding
De bestaande AI Modelwijzer is uitgebreid van 30 naar 90 modelrecords, met behoud van de negen bestaande providerfamilies.

Nieuwe of veel uitgebreidere modelklassen:
- frontier/general reasoning;
- economy/high-volume;
- coding;
- image generation/editing;
- realtime/voice;
- transcription;
- text-to-speech;
- OCR/document AI;
- embeddings/RAG;
- moderation/safety;
- video;
- open-weight/self-host.

## Besliservaring
Nieuwe filters: modality en taak/use case, naast provider, tier en governance. Modelkaarten tonen nu expliciet sterktes, beperkingen/valkuilen, deployment, kostenbasis, opslagresidentie, inferentieresidentie, training, retentie, bron en verificatiedatum.

## Governance
UNKNOWN blijft UNKNOWN. De pagina mag ontbrekende residency-, training-, retentie- of subprocessorinformatie nooit als positief bewijs interpreteren.

## Aanbevelingsengine
Specialistische modellen krijgen alleen een sterke boost wanneer de user goal bij hun specialistische taak past. Preview krijgt een penalty; retired/deprecated mag normaal niet winnen.

## Freshness
De dagelijkse audit controleert nu per model:
- officiële HTTPS-bron;
- jurisdiction;
- verified_at;
- maximaal 14 dagen freshness;
- limitations;
- storage + inference governancevelden;
- minimale specialistische class coverage;
- minimaal 80 records.

## Delivery lineage
Obligation: ai-modelwijzer-v2-completeness-2026-09-30 · lane: website · candidate: implementation.
