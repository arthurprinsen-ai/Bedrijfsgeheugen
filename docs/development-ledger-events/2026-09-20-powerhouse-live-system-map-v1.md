# Development ledger — Powerhouse Live System Map v1

Date: 2026-09-20  
Obligation: `powerhouse-live-system-map-v1`

## Goal

Put the complete Powerhouse operating architecture on one admin-only Control Center page: intelligence layers, GitHub, Netlify, Supabase, Notion, agents, skills, workflows, runtime actors and how the parts exchange state/evidence.

## Existing-state-first

Reused the existing canonical Notion authority `Powerhouse Canonical System Map & Agent Update Contract` (page id `3dcda36a-ac8a-8152-be3d-edbb32b06239`) instead of creating another architecture document or database.

## Implementation

- machine-readable topology manifest in `platform/system-map/canonical-system-map.mjs`;
- Systeemkaart becomes the first Control Center tab;
- current runtime actors are projected automatically from canonical observability events;
- repository inventory includes every current skill, agent-fabric module, Netlify function, Supabase Edge Function and GitHub workflow;
- CI compares those directories against the manifest and fails closed on drift;
- live Supabase catalog is read from a read-only RPC and authenticated Edge Function;
- admin-only Netlify observability endpoint attaches the System Map and live provider inventory;
- agent-continuity policy and skill now require same-lineage System Map registration/readback for structural changes.

## Fail-closed rule

A material chat, agent, workflow, skill or capability that executes but is not discoverable in the canonical System Map is `SYSTEM_MAP_WRITEBACK_INCOMPLETE` and may not be called `LIVE_BEWEZEN`.
