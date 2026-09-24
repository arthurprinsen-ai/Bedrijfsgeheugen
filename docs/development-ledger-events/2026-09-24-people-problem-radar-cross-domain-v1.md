# 2026-09-24 — People Problem Radar cross-domain intelligence

- Fingerprint: `powerhouse-people-problem-radar-p0-v1`
- Canonical library: `config/powerhouse-problem-library.json`
- People detection: `config/powerhouse-people-problem-detection.json`
- Cross-domain graph: `config/powerhouse-cross-domain-problem-graph.json`
- Regression: `tests/brain-powerhouse-people-problem-radar.test.mjs`
- Skill: `skills/mkb-voice-of-customer-problem-radar.md`
- Delivery PR: #2790

## Architecture rule

People/workforce intelligence is part of the same Powerhouse Brain as finance, operations, sales, knowledge, risk, strategy, executive cockpit, opportunity scoring, content/acquisition and outcome learning. There is one canonical `PH-Pxxx` truth and one evidence lineage.

## Privacy rule

Employee health, complaints and other sensitive evidence are never promoted as identifiable executive data. Default projection is aggregated/team-level; Powerhouse does not infer medical diagnoses.

## Terminal delivery rule

Do not mark this change `LIVE_BEWEZEN` until protected merge to `main`, production deployment and production readback prove the exact lineage.
