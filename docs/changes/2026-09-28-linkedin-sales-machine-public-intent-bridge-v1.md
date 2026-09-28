# LinkedIn Sales Machine — public intent bridge v1

Date: 2026-09-28
Obligation-ID: powerhouse-linkedin-sales-machine-public-intent-bridge-v1
Delivery-Lane: website
Candidate-Type: implementation

## Gap
The Sales Machine already had 20/20 Growth Swarm plays and the Persuasion Revenue Optimizer, but website selfscan completion still terminated in Web3Forms and checkout start only called the checkout endpoint. Those high-signal actions were therefore not guaranteed to enter the canonical growth/datahub context used by Powerhouse.

## Fix
- Selfscan report request emits a PII-free canonical lead_outcome to /api/growth-event after the form handoff succeeds.
- SaaS checkout start emits a PII-free canonical primary_cta_click before checkout creation.
- PII remains only in the purpose-bound form/order flow.
- LinkedIn Sales Machine skill now requires website intent to join the same commercial context and learning loop.

## Canonical loop
public intent -> growth event -> datahub/Brain queue -> Company/Relationship context -> Growth Swarm -> next-best-action -> Persuasion Revenue Optimizer -> provider execution -> outcome -> learning

## Guardrails
No e-mail address, telephone, name, form payload or address is copied into growth telemetry. Consent, evidence, dedupe, fatigue, suppression and provider capability remain authoritative.
