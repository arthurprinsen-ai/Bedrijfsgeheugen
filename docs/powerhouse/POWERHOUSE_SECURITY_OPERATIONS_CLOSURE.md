# Powerhouse Security & Operations Closure

Fingerprint: `powerhouse-security-operations-closure-v1`

## Purpose

This is an extension of the existing Powerhouse Assurance Layer, not a parallel security system. The canonical state is `powerhouse/assurance/security-operations-closure.json`; deterministic validation is performed by `scripts/security-operations-proof.mjs` and `tests/security-operations-proof.test.mjs`.

The database RLS/password hardening remains independently `LIVE & BEWEZEN` with production invariants 121 tables, 103 intentional deny-all tables, 18 policy tables, 0 policy-required missing and 0 RLS-disabled. These invariants are regression-protected by the operations validator.

## Closure controls

### 1. Supabase organization Owner MFA

Green only after authoritative management-plane evidence proves `mfa_enabled=true` for the organization Owner/control plane. Project/Auth TOTP does not satisfy this control. Enabling MFA is a human Owner action; the evidence record must be updated only after provider/dashboard readback.

Supabase current guidance: organization MFA enforcement is Owner-controlled and organization access can be blocked for members without MFA. The operational action is performed in the Supabase organization Security settings; no automation may bypass the Owner requirement.

### 2. Isolated DR restore proof

A DR drill must restore into a separate non-production environment. The validator rejects targets named `production`, `prod`, containing `production`, or containing the production project reference.

Required proof is one lineage: backup/restore point selected -> isolated restore completed -> restored data fingerprint/integrity checks -> application smoke/readback -> measured RTO -> measured RPO -> evidence reference -> cleanup/retention decision.

Never use the production project as the drill target. An in-place restore is an incident/recovery action, not a safe test. For Supabase, use a separate/duplicated project or another isolated Postgres target capable of consuming the approved backup format. Restore credentials and custom-role passwords are handled as secrets and are never committed.

### 3. Credential rotation proof

Every production credential must have a stable non-secret `credential_id` and an evidence record. A credential is not considered rotated merely because a new secret exists.

Required sequence: rotate -> reconnect every consumer -> prove old credential is rejected -> prove runtime remains healthy -> prove rollback/readback path -> record timestamp and evidence. Secret values, hashes that can be replayed, recovery codes and tokens are forbidden in repository evidence.

Production rotation must remain provider-specific and fail closed. A rotation is not started until the credential inventory, consumers, health probe and rollback path are known. This avoids turning an audit task into an outage.

### 4. Cross-platform IAM review

The canonical review must at minimum cover GitHub, Netlify, Notion and Buffer, and additionally every provider that appears in the Powerhouse dependency/credential inventory. For each provider record: humans, service accounts, access level/role, unused or stale accounts/tokens, MFA state, least-privilege conclusion, evidence, review timestamp and next review date.

Provider APIs do not all expose MFA. `unknown` never passes. Where authoritative readback is unavailable, `manual_attested` is accepted only with an evidence reference and review timestamp; this is deliberately distinguishable from `verified` provider evidence.

The review cadence is quarterly or immediately after an owner/admin change, compromise, team departure, new provider, privileged token creation or material architecture change.

## Permanent engineering gates, not defects

The current Auth database pool of 10 remains an explicit scale-readiness gate. Before changing to percentage-based pooling, evidence must include load testing, connection saturation behaviour and rollback. The current fixed value is not classified as a production defect by itself.

Unused indexes are never removed from `zero scans` alone. Removal requires representative workload evidence, before/after query plans and a rollback plan. The workload observation window must be appropriate to the business cadence, including infrequent but critical queries.

## CI and status semantics

`node scripts/security-operations-proof.mjs --check` validates contract integrity without pretending pending operational evidence is complete. `node scripts/security-operations-proof.mjs --require-live` is the full closure gate and exits non-zero until all four controls are evidenced.

The GitHub workflow runs contract tests on pull requests/pushes. A scheduled weekly run and an explicit manual `require_live=true` run enforce the full closure status. The only allowed overall green state is `LIVE & BEWEZEN`; otherwise the manifest/report remains `DEELS LIVE` with explicit obligations.

## Evidence update rules

Evidence must identify the provider/run, target/environment, timestamp and result without containing secrets. Human-only actions stay `human_action_required` until readback exists. Provider limitations stay explicit. A successful code merge is not substitute evidence for MFA, restore, credential rotation or IAM review.

After each successful drill/review/rotation, update the canonical manifest, run the deterministic tests, run the full closure gate, and write the outcome/learning into the existing Powerhouse learning/error lineage and human-readable documentation. Do not create a second IAM database, credential store, DR registry or learning system.
