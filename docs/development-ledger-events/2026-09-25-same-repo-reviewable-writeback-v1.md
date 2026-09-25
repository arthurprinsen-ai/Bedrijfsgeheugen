# Development ledger — same-repository reviewable writeback v1

Date: 2026-09-25
Obligation: `same-repo-material-writeback-standard-v1`
Fingerprint: `powerhouse|same-repo-material-writeback|reviewable-lineage|v1`

## Decision

Every current and future Powerhouse chat, agent, workflow, autonomous worker and material skill execution must keep durable closure in the canonical Bedrijfsgeheugen repository and in one reviewable obligation/candidate lineage.

## Required closure artifacts

- relevant skill execution rule or deterministic skill projection;
- machine-readable Brain/Powerhouse learning;
- append-only development-ledger event;
- human-readable repository documentation.

A chat-only statement, local side file or external note does not satisfy closure.

## Enforcement

The continuity policy now exposes a machine-readable `repository_writeback_rule` and invariant. Existing material-writeback CI and learning-to-skill projection remain the fail-closed enforcement mechanisms. The universal learning/writeback regression now verifies the same-repository contract directly.

## Terminal semantics

Missing any required repository artifact or projection means `WRITEBACK_INCOMPLETE`, never `LIVE_BEWEZEN`.
