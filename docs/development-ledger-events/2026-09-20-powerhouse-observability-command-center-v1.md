# Development ledger — Powerhouse Observability Command Center v1

Date: 2026-09-20
Obligation: `powerhouse-observability-command-center-v1`
Fingerprint: `powerhouse-observability-command-center-v1`

## Built

A new native Portal V2 page, **Powerhouse Control Center**, projects the existing `/api/brain-operating-loop` authority into one filterable operator cockpit.

Visible dimensions:
- AI agents, chats/workers and actors;
- GitHub / CI / merge / deployment / readback activity;
- errors, blocked states, drift and fingerprints;
- system/platform layers and component health;
- Brain learning, development/documentation signals and memory/writeback;
- skill/projection events;
- delivery terminal evidence;
- expected value, actual cost, realized value and realized profit when supplied by the canonical projection.

Filters:
- today / 7 days / 30 days / all;
- actor;
- layer;
- status class;
- source/provider;
- full-text search.

## Truth boundary

This is a read model, not a new truth store. It consumes the canonical Brain operating-loop projection. Missing runtime evidence remains empty/unknown and is never replaced by example status.

## Architecture

`brain-operating-loop authority → /api/brain-operating-loop → runtime-evidence.js normalization → Powerhouse Control Center → filters / analysis / drill-down`

## Prevention

Future observability features must extend the canonical projection or its deterministic read model. They must not create a parallel dashboard database simply to make charts easier.
