# Powerhouse one commercial closed loop v2

Date: 2026-10-05

Bedrijfsgeheugen now treats the commercial journey as one canonical lineage instead of a collection of loosely connected sales, message, provider and learning steps.

## Canonical flow

`signal/event → identity/company context → intent/opportunity → NBA → pressure/cooldown → research when evidence is insufficient → sales play/psychology/message → exact quality gate → provider → terminal outcome/revenue → attribution → learning → next decision`

## External execution truth

A provider HTTP response is transport evidence, not execution proof. A LinkedIn call may return HTTP 200 while the semantic payload still rejects execution, for example `CONCRETE_POST_CONTEXT_REQUIRED`. In that case the action remains non-terminal and provider acknowledgement remains zero.

External execution therefore requires all of the following before an action can become terminal:

- current source URL/context;
- consent/capability eligibility;
- pressure and cooldown eligibility;
- dedupe proof;
- exact-message-hash quality proof;
- provider acknowledgement;
- terminal outcome/readback.

## One owner, one lineage

The canonical loop prevents a second commercial scheduler-owner or parallel v2 action path from becoming authoritative. Heavy identity/research/learning work stays bounded or independently scheduled so it cannot block the heartbeat.

## Learning boundary

No-response is recorded as an observation. It may inform future decisions, but it is never converted into a fabricated rejection or negative response.

## Delivery closure

This material Supabase change carries its Brain-learning record, development-ledger event and human-readable change documentation in the same candidate. GitHub may merge only after the complete exact-HEAD gate set is green. LIVE/production truth is declared only after post-merge production readback.
